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
    Senders TEXT,
    Receivers TEXT,
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
    print("Insert Invoice")

    local senders_json = json.encode(invoice.Senders or {})
    local receivers_json = json.encode(invoice.Receivers or {})
    local invoice_note = invoice.InvoiceNote or ""
    local invoice_status = invoice.Status or "Pending"
    local invoice_type = invoice.InvoiceType or "Payment"
    local category = invoice.Category or "Uncategorized"
    local timestamp = invoice.Timestamp or os.time()

    print("Inserting invoice with receivers JSON")

    local invoice_amount = invoice.Amount or 0
    if type(invoice.Amount) ~= "number" then
        invoice_amount = 0
        for _, sender in ipairs(invoice.Senders) do
            invoice_amount = invoice_amount + (tonumber(sender.Amount) or 0)
        end
    end

    local query = string.format([[
      INSERT INTO Invoices (Senders, Receivers, Timestamp, InvoiceNote, Amount, Status, InvoiceType, Category) 
      VALUES ('%s', '%s', %d, "%s", %d, "%s", "%s", "%s");
    ]], 
    senders_json, 
    receivers_json, 
    timestamp, 
    invoice_note, 
    invoice_amount, 
    invoice_status, 
    invoice_type, 
    category)

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
    print("Searching for InvoiceID: " .. invoiceId)

    local query = string.format("SELECT * FROM Invoices WHERE InvoiceID = '%s';", invoiceId)
    local invoices = dbAdmin:exec(query)

    if #invoices == 0 then
        print("No invoice found with ID: " .. invoiceId)
        return
    end

    for _, row in ipairs(invoices) do
        print("InvoiceID: " .. (row.InvoiceID or "N/A"))
        print("ReceiverName: " .. (row.ReceiverName or "N/A"))
        print("ReceiverWallet: " .. (row.ReceiverWallet or "N/A"))
        print("Timestamp: " .. (row.Timestamp or "N/A"))
        print("PaidTimestamp: " .. (row.PaidTimestamp or "N/A"))
        print("InvoiceNote: " .. (row.InvoiceNote or "N/A"))
        print("Amount: " .. (row.Amount or "N/A"))
        print("Status: " .. (row.Status or "N/A"))
        
        local senders = json.decode(row.Senders or '[]')
        print("Senders:")
        for _, sender in ipairs(senders) do
            print("  - Address: " .. (sender.Address or "N/A"))
            print("    Amount: " .. (sender.Amount or "N/A"))
            print("    Status: " .. (sender.Status or "N/A"))
        end

        local receivers = json.decode(row.Receivers or '[]')
        print("Receivers:")
        for _, receiver in ipairs(receivers) do
            print("  - Address: " .. (receiver.Address or "N/A"))
            print("    Amount: " .. (receiver.Amount or "N/A"))
            print("    Status: " .. (receiver.Status or "N/A"))
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

function CreatePrePaidInvoice(paidInvoice, sender, quantity, msg)

    print("Creating prepaid invoice from PAID_INVOICE data")

    local invoiceData = json.decode(paidInvoice)
    if not invoiceData then
        print("Failed to decode PAID_INVOICE.")
        return
    end

    local senderName = invoiceData.SenderName or "Unknown"
    local senderWallet = invoiceData.SenderWallet or sender
    local receivers = invoiceData.Receivers or {}
    local invoiceNote = invoiceData.InvoiceNote or ""
    local invoiceType = invoiceData.InvoiceType or "PrePaid"
    local category = invoiceData.Category or "Unknown"
    local totalAmount = invoiceData.Total or quantity
    local timestamp_ms = msg["Timestamp"]
    local timestamp_seconds = math.floor(timestamp_ms / 1000)

    local invoice = {
        InvoiceType = invoiceType,
        Category = category,
        SenderName = senderName,
        SenderWallet = senderWallet,
        Receivers = receivers,
        InvoiceNote = invoiceNote,
        Amount = totalAmount,
        Status = "Pending",
        Timestamp = timestamp_seconds
    }

    insertInvoice(invoice)
    print("Prepaid invoice created successfully.")
end

function PayInvoice(invoiceId, sender, quantity, msg)
    print("Paying InvoiceID: " .. invoiceId)

    local query = string.format([[
        SELECT * FROM Invoices WHERE InvoiceID = "%s";
    ]], invoiceId)

    local invoice = dbAdmin:exec(query)

    if #invoice == 0 then
        print("Invoice not found: " .. invoiceId)
        return
    end

    local invoiceData = invoice[1]
    local invoiceAmount = invoiceData.Amount
    local invoiceStatus = invoiceData.Status
    local sendersJson = invoiceData.Senders
    local receiversJson = invoiceData.Receivers

    local senders = json.decode(sendersJson or "[]")
    local receivers = json.decode(receiversJson or "[]")

    if type(receivers) ~= "table" or #receivers == 0 then
        print("No receivers found for this invoice.")
        return
    end

    local matchingSender = nil
    for _, senderObj in ipairs(senders) do
        if senderObj.Address == sender then
            matchingSender = senderObj
            break
        end
    end

    if not matchingSender then
        print("Sender not found in this invoice.")
        return
    end

    if tonumber(matchingSender.Amount) ~= quantity then
        print("Payment does not match the sender's amount. Received: " .. quantity .. ", Expected: " .. matchingSender.Amount)
        return
    end

    matchingSender.Status = "Paid"
    local timestamp_ms = msg["Timestamp"]
    local timestamp_seconds = math.floor(timestamp_ms / 1000)

    local allSendersPaid = true
    for _, senderObj in ipairs(senders) do
        if senderObj.Status ~= "Paid" then
            allSendersPaid = false
            break
        end
    end

    local newInvoiceStatus = allSendersPaid and "Paid" or "Pending"

    sendersJson = json.encode(senders)
    local updateQuery = string.format([[
        UPDATE Invoices 
        SET Senders = '%s', Status = "%s", PaidTimestamp = %d
        WHERE InvoiceID = "%s";
    ]], sendersJson, newInvoiceStatus, timestamp_seconds, invoiceId)

    dbAdmin:exec(updateQuery)
    print("Updated sender status and invoice status: " .. newInvoiceStatus)

    for _, receiver in ipairs(receivers) do
        Send({
            Target = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8",
            Action = "Transfer",
            Quantity = tostring(quantity),
            Recipient = receiver.Address
        })
        print("Payment sent to receiver: " .. receiver.Address)
    end

    print("Invoice payment process complete.")
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
    local receivers = data.Receivers
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

    if type(receivers) == "table" then
        print("Receivers is a table with the following entries:")
        for i, receiver in ipairs(receivers) do
            print("Receiver " .. i .. ":")
            print("  Name: " .. (receiver.Name or "N/A"))
            print("  Address: " .. (receiver.Address or "N/A"))
            print("  Amount: " .. (receiver.Amount or "N/A"))
            print("  Status: " .. (receiver.Status or "N/A"))
        end
    else
        print("Error: Receivers is not a table. Actual type: " .. type(receivers))
    end

    local invoice = {
        ReceiverName = receiver_name,
        ReceiverWallet = receiver_wallet,
        Timestamp = timestamp_seconds,
        InvoiceNote = invoice_note,
        Amount = invoice_amount,
        Status = "Pending",
        Senders = senders,
        Receivers = receivers,
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

    local query = [[
      SELECT * FROM Invoices 
      ORDER BY Timestamp DESC;
    ]]
    
    local all_invoices = dbAdmin:exec(query)

    local matching_invoices = {}

    for _, invoice in ipairs(all_invoices) do
        local senders = json.decode(invoice.Senders or '[]')
        for _, sender in ipairs(senders) do
            if sender.Address == address then
                table.insert(matching_invoices, invoice)
                break
            end
        end

        local receivers = json.decode(invoice.Receivers or '[]')
        for _, receiver in ipairs(receivers) do
            if receiver.Address == address then
                table.insert(matching_invoices, invoice)
                break
            end
        end
    end

    if #matching_invoices == 0 then
        print("No invoices found for Address: " .. address)
        Send({ Target = msg.From, Data = json.encode({ error = "No invoices found." }) })
        return
    end

    local invoices_json = json.encode(matching_invoices)
    print("Matching Invoices: " .. invoices_json)
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
        local paidInvoice = msg["X-[PAID_INVOICE]"] or ""
        local sender = msg.Sender or "Unknown Sender"
        local quantity = tonumber(msg.Quantity or 0)

        print("Credit-Notice: " .. quantity)

        if invoiceId ~= "" then
            print("Processing payment for InvoiceID: " .. invoiceId)
            PayInvoice(invoiceId, sender, quantity, msg)
        elseif paidInvoice ~= "" then
            print("Processing prepaid invoice")
            CreatePrePaidInvoice(paidInvoice, sender, quantity, msg)
        else
            print("No valid X-[INVOICEID] or X-[PAID_INVOICE] tag found.")
        end

        -- If incorrect amount of id, then add to a LOOSE_PAYMENTS db
    end
)


Handlers.add(
    "Debit-Notice",
    Handlers.utils.hasMatchingTag("Action", "Debit-Notice"),
    function (msg) 
        print("Debit-Notice: " .. msg.Quantity)
    end
)


