-- Process ID: cbLiv_6bsPlIIObQhsaZlY4DxCFg-XmCuQLuVF9WsS8
local json = require("json")
local sqlite3 = require("lsqlite3")

db = db or sqlite3.open_memory()
dbAdmin = require('DbAdmin').new(db)

-- QAR = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8";

INVOICES = [[
  CREATE TABLE IF NOT EXISTS Invoices (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    InvoiceID TEXT,
    InvoiceType TEXT, 
    Category TEXT,
    ReceiverName TEXT,
    ReceiverWallet TEXT,
    Senders TEXT,
    Timestamp INTEGER,
    PaidTimestamp INTEGER,
    InvoiceNote TEXT,
    Amount INTEGER,
    Status TEXT
  );
]]

-- Note: Must Initialize the DB before using it
function InitDb() 
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
    local receiver_name = invoice.ReceiverName or "Unknown"
    local receiver_wallet = invoice.ReceiverWallet or "Unknown Wallet"
    local senders_json = json.encode(invoice.Senders or {})
    local invoice_note = invoice.InvoiceNote or ""
    local invoice_status = invoice.Status or "Pending"
    local invoice_type = invoice.InvoiceType or "Payment"
    local category = invoice.Category or "Uncategorized"
    local timestamp = invoice.Timestamp or os.time()

    print("Inserting invoice for: " .. receiver_name)

    local invoice_amount = invoice.Amount or 0
    if type(invoice.Amount) ~= "number" then
        invoice_amount = 0
        for _, sender in ipairs(invoice.Senders) do
            invoice_amount = invoice_amount + (tonumber(sender.Amount) or 0)
        end
    end

    local query = string.format([[
      INSERT INTO Invoices (ReceiverName, ReceiverWallet, Senders, Timestamp, InvoiceNote, Amount, Status, InvoiceType, Category) 
      VALUES ("%s", "%s", '%s', %d, "%s", %d, "%s", "%s", "%s");
    ]], receiver_name, receiver_wallet, senders_json, timestamp, invoice_note, invoice_amount, invoice_status, invoice_type, category)

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
        print("PaidTimestamp: " .. (row.PaidTimestamp or "N/A"))
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
        print("Timestamp: " .. (row.Timestamp or "N/A"))
        print("PaidTimestamp: " .. (row.PaidTimestamp or "N/A"))
        print("InvoiceNote: " .. (row.InvoiceNote or "N/A"))
        print("Amount: " .. (row.Amount or "N/A"))
        print("Status: " .. (row.Status or "N/A"))
        
        local requestees = json.decode(row.Requestees or '[]')
        print("Requestees:")
        for _, requestee in ipairs(requestees) do
            print("  - Address: " .. requestee.Address)
            print("    Amount: " .. requestee.Amount)
            print("    Status: " .. requestee.Status)
        end
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

Handlers.add("AddTable", "AddTable", function (msg)    
    print( "AddTable Hit!" ) 

    if dbAdmin then
        print("dbAdmin is not nil")
    else
        print("dbAdmin is nil")
    end

end)

Handlers.add("CreateNewInvoice", "Create-New-Invoice", function (msg)
    print("CreateNewInvoice" .. msg.Data )

    local data = json.decode(msg.Data)
    local receiver_name = data.ReceiverName
    local receiver_wallet = msg.From
    local timestamp_ms = msg["Timestamp"]
    local timestamp_seconds = math.floor(timestamp_ms / 1000)
    local invoice_note = data.Note
    local invoice_amount = data.Amount
    local senders = data.Senders
    local invoice_type = data.InvoiceType or "Payment"
    local category = data.Category or "Uncategorized"

    if type(senders) == "table" then
        print("Senders is a table with the following entries:")
        for i, sender in ipairs(senders) do
            print("Sender " .. i .. ":")
            print("  Address: " .. (sender.Address or "N/A"))
            print("  Amount: " .. (sender.Amount or "N/A"))
            print("  Status: " .. (sender.Status or "N/A"))
        end
    else
        print("Error: Senders is not a table. Actual type: " .. type(senders))
    end

    local invoice = {
        ReceiverName = receiver_name,
        ReceiverWallet = receiver_wallet,
        Timestamp = timestamp_seconds,
        InvoiceNote = invoice_note,
        Amount = invoice_amount,
        Status = "Pending",
        Senders = senders,
        InvoiceType = invoice_type,
        Category = category
    }
    
    insertInvoice(invoice)

    local invoice_json = json.encode(invoice)
    Send({ Target = msg.From, Data = invoice_json })
end)


Handlers.add("DeleteInvoice", "Delete-Invoice", function (msg)
    local data = json.decode(msg.Data)
    local invoiceId = data.InvoiceID
    local senderWallet = msg.From

    print("DeleteInvoice: " .. invoiceId)

    local query = string.format("SELECT * FROM Invoices WHERE InvoiceID = '%s' AND ReceiverWallet = '%s';", invoiceId, senderWallet)
    local invoice = dbAdmin:exec(query)

    if #invoice == 0 then
        print("No matching invoice found or sender (" .. senderWallet .. ") is not authorized to delete.")
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
      WHERE ReceiverWallet = "%s" OR Senders LIKE '%%%s%%'
      ORDER BY Timestamp DESC;
    ]], address, address)

    local all_invoices = dbAdmin:exec(query)

    local matching_invoices = {}

    for _, invoice in ipairs(all_invoices) do
        if invoice.ReceiverWallet == address then
            table.insert(matching_invoices, invoice)
        else
            local senders = json.decode(invoice.Senders or '[]')
            for _, sender in ipairs(senders) do
                if sender.Address == address then
                    table.insert(matching_invoices, invoice)
                    break -- Stop checking other senders if we found a match
                end
            end
        end
    end

    if #matching_invoices == 0 then
        print("No invoices found for Address: " .. address)
        Send({ Target = msg.From, Data = json.encode({ error = "No invoices found." }) })
        return
    end

    local invoices_json = json.encode(matching_invoices)
    print("Matching Invoices: " .. invoices_json )
    Send({ Target = msg.From, Data = invoices_json })
end)


Handlers.add("GetInvoiceById", "Get-Invoice-By-Id", function (msg)
    local data = json.decode(msg.Data)
    local invoiceId = data.InvoiceID

    -- Check the msg.From is either the Requestor or Requestee. [Disabled for demo]

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


Handlers.add(
    "Credit-Notice",
    Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
    function (msg)

        local invoiceId = msg["X-[INVOICEID]"] or "" 
        local sender = msg.Sender or "Unknown Sender"
        local quantity = tonumber(msg.Quantity or 0)

        if msg.From ~= "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8" then
            print("Invalid source for Credit-Notice")
            return
        end

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
        local receiverWallet = invoice[1].ReceiverWallet
        local sendersJson = invoice[1].Senders

        local senders = json.decode(sendersJson or "[]")
        if type(senders) ~= "table" then
            print("Failed to decode senders or no senders available.")
            return
        end

        local matchingSenderIndex = nil
        for i, senderObj in ipairs(senders) do
            if senderObj.Address == sender then
                matchingSenderIndex = i
                break
            end
        end

        if not matchingSenderIndex then
            print("Sender with sender address not found in the invoice.")
            return
        end

        local matchingSender = senders[matchingSenderIndex]

        if tonumber(matchingSender.Amount) == quantity then
            print("Payment matches the sender's amount.")

            matchingSender.Status = "Paid"
            local timestamp_ms = msg["Timestamp"]
            local timestamp_seconds = math.floor(timestamp_ms / 1000)
            matchingSender.PaidTimestamp = timestamp_seconds

            local allPaid = true
            for _, senderObj in ipairs(senders) do
                if senderObj.Status ~= "Paid" then
                    allPaid = false
                    break
                end
            end

            local newInvoiceStatus = allPaid and "Paid" or "Pending"

            sendersJson = json.encode(senders)
            local updateQuery = string.format([[
                UPDATE Invoices 
                SET Senders = '%s', Status = "%s", PaidTimestamp = %d 
                WHERE InvoiceID = "%s";
            ]], sendersJson, newInvoiceStatus, timestamp_seconds, invoiceId)

            dbAdmin:exec(updateQuery)
            print("Updated sender status to Paid and saved to database.")

            if newInvoiceStatus == "Paid" then
                print("Invoice " .. invoiceId .. " is fully paid.")
            end

            Send({
                Target = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8",
                Action = "Transfer",
                Quantity = tostring(quantity),
                Recipient = receiverWallet
            })
        else
            print("Payment does not match the sender's amount. Received: " .. quantity .. ", Expected: " .. matchingSender.Amount)
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


