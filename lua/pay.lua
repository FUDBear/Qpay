-- Process ID: 2JGFChGEpgmOuXuR48w4N_YnNmi-4Gv5e6jrzUOGvK4
local json = require("json")
local sqlite3 = require("lsqlite3")

local db = db or sqlite3.open_memory()
local dbAdmin = require('DbAdmin').new(db)

-- QAR = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8";

local INVOICES = [[
  CREATE TABLE IF NOT EXISTS Invoices (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    InvoiceID TEXT,
    RequestorName TEXT,
    RequestorWallet TEXT,
    RequesteeWallet TEXT,
    Timestamp INTEGER,
    InvoiceNote TEXT,
    Amount INTEGER,
    Status TEXT
  );
]]

-- Note: Must Initialize the DB before using it
function InitDb() 
    -- db:exec(USERS)
    -- db:exec(MESSAGES)
    db:exec(INVOICES)
    print("--InitDb--")
end

local function sanitize(input)
    return input:gsub('"', '\\"')
end

local function insertUser(pid, nickname)
    pid = sanitize(pid)
    nickname = sanitize(nickname or 'anon')

    print("Inserting user: " .. pid .. ", " .. nickname)

    dbAdmin:exec(string.format([[
      INSERT INTO Users (PID, Nickname) VALUES ("%s", "%s");
    ]], pid, nickname))
end

local function insertInvoice(invoice)
    local requestor_name = invoice.RequestorName
    local requestor_wallet = invoice.RequestorWallet
    local requestee_wallet = invoice.RequesteeWallet
    local invoice_note = invoice.InvoiceNote or ""
    local invoice_amount = invoice.Amount
    local invoice_status = invoice.Status
    local timestamp = invoice.Timestamp

    local query = string.format([[
      INSERT INTO Invoices (RequestorName, RequestorWallet, RequesteeWallet, Timestamp, InvoiceNote, Amount, Status) 
      VALUES ("%s", "%s", "%s", %d, "%s", %d, "%s");
    ]], requestor_name, requestor_wallet, requestee_wallet, timestamp, invoice_note, invoice_amount, invoice_status)

    dbAdmin:exec(query)

    local unique_id = db:last_insert_rowid()
    local invoice_id = string.format("INV-%03d-%d", unique_id, timestamp)

    local update_query = string.format([[
      UPDATE Invoices SET InvoiceID = "%s" WHERE ID = %d;
    ]], invoice_id, unique_id)

    dbAdmin:exec(update_query)

    print("Invoice inserted with ID: " .. invoice_id)
end



local function printAllInvoices()
    print("All Invoices:")

    local invoices = dbAdmin:exec("SELECT * FROM Invoices;")

    if #invoices == 0 then
        print("No invoices found.")
        return
    end

    for _, row in ipairs(invoices) do
        print("InvoiceID: " .. (row.InvoiceID or "N/A"))
        print("RequestorName: " .. (row.RequestorName or "N/A"))
        print("RequestorWallet: " .. (row.RequestorWallet or "N/A"))
        print("RequesteeWallet: " .. (row.RequesteeWallet or "N/A"))
        print("Timestamp: " .. (row.Timestamp or "N/A"))
        print("InvoiceNote: " .. (row.InvoiceNote or "N/A"))
        print("Amount: " .. (row.Amount or "N/A"))
        print("Status: " .. (row.Status or "N/A"))
        print("--------------------------------------------------")
    end
end

local function printInvoiceById(invoiceId)
    print("Searching for InvoiceID:" .. invoiceId)

    local query = string.format("SELECT * FROM Invoices WHERE InvoiceID = '%s';", invoiceId)
    local invoices = dbAdmin:exec(query)

    if #invoices == 0 then
        print("No invoice found with ID: " .. invoiceId)
        return
    end

    for _, row in ipairs(invoices) do
        print("InvoiceID: " .. (row.InvoiceID or "N/A"))
        print("RequestorName: " .. (row.RequestorName or "N/A"))
        print("RequestorWallet: " .. (row.RequestorWallet or "N/A"))
        print("RequesteeWallet: " .. (row.RequesteeWallet or "N/A"))
        print("Timestamp: " .. (row.Timestamp or "N/A"))
        print("InvoiceNote: " .. (row.InvoiceNote or "N/A"))
        print("Amount: " .. (row.Amount or "N/A"))
        print("Status: " .. (row.Status or "N/A"))
        print("--------------------------------------------------")
    end
end


local function printAllUsers()

    print("All Users:")

    local users = dbAdmin:exec("SELECT * FROM Users;")

    if #users == 0 then
        print("No users found.")
        return
    end

    for _, row in ipairs(users) do
        print("User: PID: " .. (row.PID or "N/A") .. ", Nickname: " .. (row.Nickname or "N/A"))
    end
end



local function selectUserByPID(pid)
    local select_sql = 'SELECT * FROM Users WHERE PID = ?;'
    local results = dbAdmin:select(select_sql, { pid })

    if #results > 0 then
        for _, user in ipairs(results) do
            print("PID: " .. user.PID .. ", Nickname: " .. user.Nickname)
        end
    else
        print("No user found with PID: " .. pid)
    end
end

Handlers.add("Init", "Init", function (msg)  
    
    -- admin only
    if msg.From ~= ao.id then
        return
    end

    InitDb()
end)

Handlers.add("CleanTables", "Clean-Tables", function (msg)  
    
    -- admin only
    if msg.From ~= ao.id then
        return
    end

    local query = string.format("DROP TABLE IF EXISTS %s;", "Invoices")
    dbAdmin:exec(query)

end)

Handlers.add("Tester", "Tester", function (msg)    
    print( "Tester Hit!" ) 

    local tables = dbAdmin:tables()
    print("Tables:")
    for _, table in ipairs(tables) do
        print(table)
    end
end)

Handlers.add("AddTable", "AddTable", function (msg)    
    print( "AddTable Hit!" ) 

    if dbAdmin then
        print("dbAdmin is not nil")
    else
        print("dbAdmin is nil")
    end

end)

Handlers.add("GetUsers", "GetUsers", function (msg)  
    
    -- Assuming msg["Timestamp"] is in milliseconds
    local timestamp_ms = msg["Timestamp"]
    local timestamp_seconds = math.floor(timestamp_ms / 1000)

    -- Print the timestamp in seconds
    print("Timestamp in seconds: " .. timestamp_seconds)

    -- printAllUsers()
    Send({ Target = msg.From, Data = "" .. timestamp_seconds })

    -- msg.reply({Data = "Hello " .. msg.Data or "bob"})
    -- Handlers.utils.reply("Get Dem Users")(msg.From)
end)

Handlers.add("CreateNewInvoice", "Create-New-Invoice", function (msg)

    print("CreateNewInvoice" .. msg.Data )

    local data = json.decode(msg.Data)
    local requestor_name = data.RequestorName
    local requestor_wallet = msg.From
    local requestee_wallet = data.RequesteeAddress
    local timestamp_ms = msg["Timestamp"]
    local timestamp_seconds = math.floor(timestamp_ms / 1000)
    local invoice_note = data.Note
    local invoice_amount = data.Amount
    local new_id = "INV-" .. timestamp_seconds
    local invoice_id = new_id

    local invoice = {
        InvoiceID = invoice_id,
        RequestorName = requestor_name,
        RequestorWallet = requestor_wallet,
        RequesteeWallet = requestee_wallet,
        Timestamp = timestamp_seconds,
        InvoiceNote = invoice_note,
        Amount = invoice_amount,
        Status = "Pending"
    }

    insertInvoice(invoice)

    local invoice_json = json.encode(invoice)

    print("Invoice JSON: " .. invoice_json)

    printAllInvoices()

    Send({ Target = msg.From, Data = invoice_json })
end)

Handlers.add("DeleteInvoice", "Delete-Invoice", function (msg)

    local data = json.decode(msg.Data)
    local invoiceId = data.InvoiceID
    local senderWallet = msg.From

    print("DeleteInvoice: " .. invoiceId)

    local query = string.format("SELECT * FROM Invoices WHERE InvoiceID = '%s' AND RequestorWallet = '%s';", invoiceId, senderWallet)
    local invoice = dbAdmin:exec(query)

    if #invoice == 0 then
        print("No matching invoice found or sender (" .. senderWallet ..  ") is not authorized to delete.")
        return
    end

    local deleteQuery = string.format("DELETE FROM Invoices WHERE InvoiceID = '%s';", invoiceId)
    dbAdmin:exec(deleteQuery)

    print("Invoice " .. invoiceId .. " has been deleted.")
end)


Handlers.add("GetAddressInvoices", "Get-Address-Invoices", function (msg)

    local data = json.decode(msg.Data)
    local address = data.Address

    print("GetAddressInvoices for Address: " .. address)

    local query = string.format([[
      SELECT * FROM Invoices 
      WHERE RequestorWallet = "%s" OR RequesteeWallet = "%s"
      ORDER BY Timestamp DESC; -- Change to ASC if you want oldest first
    ]], address, address)

    local invoices = dbAdmin:exec(query)

    if #invoices == 0 then
        print("No invoices found for Address: " .. address)
        Send({ Target = msg.From, Data = json.encode({ error = "No invoices found." }) })
        return
    end

    local invoices_json = json.encode(invoices)

    Send({ Target = msg.From, Data = invoices_json })
end)

Handlers.add("GetInvoiceById", "Get-Invoice-By-Id", function (msg)
    local data = json.decode(msg.Data)
    local invoiceId = data.InvoiceID

    -- Doubel check the msg.Form is either the Requestor or Requestee?

    if not invoiceId then
        print("No InvoiceID provided.")
        Send({ Target = msg.From, Data = json.encode({ error = "InvoiceID is required." }) })
        return
    end

    local query = string.format([[
      SELECT * FROM Invoices 
      WHERE InvoiceID = "%s";
    ]], invoiceId)

    print("Fetching invoice with ID: " .. invoiceId)
    local invoice = dbAdmin:exec(query)

    printInvoiceById( invoiceId );

    if #invoice == 0 then
        print("No invoice found with ID: " .. invoiceId)
        Send({ Target = msg.From, Data = json.encode({ error = "No invoice found with the provided ID." }) })
        return
    end

    local invoice_json = json.encode(invoice[1])
    Send({ Target = msg.From, Data = invoice_json })
end)



-- Handlers.add("PayInvoice", "Pay-Invoice", function (msg)
    
--     print("PayInvoice" )

--     -- get the invoice from invoiceId
--     -- make sure the sender is the RequesteeWallet
--     -- update the invoice status to "Paid"
-- end)

Handlers.add(
    "Credit-Notice",
    Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
    function (msg)

        local invoiceId = msg["X-[INVOICEID]"] or "" 
        local sender = msg.Sender or "Unknown Sender"
        local quantity = msg.Quantity or 0

        if msg.From ~= "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8" then
            print("Invalid source for Credit-Notice")
            return
        end

        print( "From: " .. msg.From )

        print("Got qAR: " .. quantity .. " from " .. sender .. " for invoice " .. invoiceId)

        local query = string.format([[
            SELECT * FROM Invoices WHERE InvoiceID = "%s";
        ]], invoiceId)

        local invoice = dbAdmin:exec(query)

        if #invoice == 0 then
            print("Invoice not found: " .. invoiceId)
            return
        end

        local invoiceAmount = invoice[1].Amount
        local invoiceStatus = invoice[1].Status
        local requesteeWallet = invoice[1].RequesteeWallet
        local requestorWallet = invoice[1].RequestorWallet

        -- if sender ~= requesteeWallet then
        --     print("Sender does not match the RequesteeWallet for invoice " .. invoiceId)
        --     return
        -- end

        if tonumber(quantity) == tonumber(invoiceAmount) then
            print("Payment matches the invoice amount.")

            local updateQuery = string.format([[
                UPDATE Invoices SET Status = "Paid" WHERE InvoiceID = "%s";
            ]], invoiceId)
            
            dbAdmin:exec(updateQuery)
            print("Invoice " .. invoiceId .. " has been marked as Paid.")

            -- Pay The Requestor
            print( "Sending Payment To: " .. requestorWallet  )
            Send({ Target = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8", Action = "Transfer", Quantity = "" .. invoiceAmount, Recipient = requestorWallet })

        else
            print("Payment does not match the invoice amount. Received: " .. quantity .. ", Expected: " .. invoiceAmount)
        end
    end
)

Handlers.add(
    "Debit-Notice",
    Handlers.utils.hasMatchingTag("Action", "Debit-Notice"),
    function (msg) 
        print("Debit-Notice: " .. msg.Quantity)
    end
)


