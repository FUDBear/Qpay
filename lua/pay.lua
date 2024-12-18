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
    Signers TEXT,
    Timestamp INTEGER,
    PaidTimestamp INTEGER,
    InvoiceNote TEXT,
    Amount INTEGER,
    Status TEXT,
    Owner TEXT,
    OwnerName TEXT
  );
]]

function InitDb() 
    db:exec(INVOICES)
    print("--InitDb--")

    local alterQuery = [[
        PRAGMA foreign_keys = OFF;
        BEGIN TRANSACTION;

        -- Create a temporary table with the new "Signers" column
        CREATE TABLE IF NOT EXISTS Invoices_temp (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            InvoiceID TEXT UNIQUE,  -- Add UNIQUE constraint here
            InvoiceType TEXT, 
            Category TEXT,
            Senders TEXT,
            Receivers TEXT,
            Signers TEXT,
            Timestamp INTEGER,
            PaidTimestamp INTEGER,
            InvoiceNote TEXT,
            Amount INTEGER,
            Status TEXT,
            Owner TEXT,
            OwnerName TEXT
        );

        -- Copy data from the old table
        INSERT INTO Invoices_temp (
            ID, InvoiceID, InvoiceType, Category, Senders, Receivers, Timestamp, PaidTimestamp, InvoiceNote, Amount, Status, Owner, OwnerName
        )
        SELECT ID, InvoiceID, InvoiceType, Category, Senders, Receivers, Timestamp, PaidTimestamp, InvoiceNote, Amount, Status, Owner, OwnerName
        FROM Invoices;

        -- Drop old table and rename the new table
        DROP TABLE Invoices;
        ALTER TABLE Invoices_temp RENAME TO Invoices;

        COMMIT;
        PRAGMA foreign_keys = ON;
    ]]
    
    local result = db:exec(alterQuery)
    if result ~= sqlite3.OK then
        print("Error adding 'Signers' column to Invoices table.")
    else
        print("'Signers' column added to Invoices table successfully.")
    end
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
    print("--------------- Insert Invoice ---------------")

    local senders_json = json.encode(invoice.Senders or {})
    local receivers_json = json.encode(invoice.Receivers or {})
    local signers_json = json.encode(invoice.Signers or {})
    local invoice_note = invoice.InvoiceNote or ""
    local invoice_status = invoice.Status or "Pending"
    local invoice_type = invoice.InvoiceType or "Payment"
    local category = invoice.Category or "Uncategorized"
    local timestamp = invoice.Timestamp or os.time()
    local paid_timestamp = invoice.PaidTimestamp or 0
    local owner = invoice.Owner or "Unknown"
    local owner_name = invoice.OwnerName or "Unknown"

    local invoice_amount = invoice.Amount or 0
    if type(invoice.Amount) ~= "number" then
        invoice_amount = 0
        for _, sender in ipairs(invoice.Senders) do
            invoice_amount = invoice_amount + (tonumber(sender.Amount) or 0)
        end
    end

    local query = string.format([[
      INSERT INTO Invoices (Owner, OwnerName, Senders, Receivers, Signers, Timestamp, InvoiceNote, Amount, Status, InvoiceType, Category) 
      VALUES ("%s", "%s", '%s', '%s', '%s', %d, "%s", %d, "%s", "%s", "%s");
    ]], 
    owner, 
    owner_name,
    senders_json, 
    receivers_json, 
    signers_json,
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

    if invoice_type == "PrePaid" then
        ProcessFunds(invoice, invoice_id, timestamp)
    elseif invoice_type == "PrePaidScheduled" then
        print(string.format("Invoice %s is a PrePaidScheduled type and will be processed later based on the schedule.", invoice_id))
    elseif invoice_type == "PrePaidSigned" then
        print(string.format("Invoice %s is a PrePaidSigned type", invoice_id))
    else
        print(string.format("Invoice %s has an unrecognized type: %s.", invoice_id, invoice_type))
    end
    
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
            print("    ScheduledTimestamp: " .. (receiver.ScheduledTimestamp or "N/A"))
        end

        local signers = json.decode(row.Signers or '[]')
        print("Signers:")
        for _, signer in ipairs(signers) do
            print("  - Address: " .. (signer.Address or "N/A"))
            print("    Status: " .. (signer.Status or "N/A"))
            print("    Timestamp: " .. (signer.Timestamp or "N/A"))
        end

        print("--------------------------------------------------")
    end
end

function CreatePrePaidInvoice(paidInvoice, sender, quantity, msg)
    print("------------ Creating PrePaid Invoice ------------")

    local invoiceData = json.decode(paidInvoice)
    if not invoiceData then
        print("Failed to decode PAID_INVOICE.")
        return
    end

    local timestamp_ms = msg["Timestamp"]
    local timestamp_seconds = math.floor(timestamp_ms / 1000)
    local paid_timestamp = timestamp_seconds
    local invoice_note = invoiceData.InvoiceNote or "No Note"
    local invoice_amount = tonumber(invoiceData.Total or quantity)
    local senders = invoiceData.Senders or {}
    local receivers = invoiceData.Receivers or {}
    local signers = invoiceData.Signers or {}
    local invoice_type = invoiceData.InvoiceType or "PrePaid"
    local category = invoiceData.Category or "Uncategorized"
    local owner = sender
    local owner_name = invoiceData.OwnerName or "Unknown"

    if type(senders) == "table" then
        print("Senders list:")
        for i, senderObj in ipairs(senders) do
            senderObj.Status = "Pending"
            senderObj.Amount = invoice_amount
            senderObj.PaidTimestamp = timestamp_seconds
            print(string.format(
                "Sender %d: Address: %s, Amount: %s, Status: %s, PaidTimestamp: %s",
                i,
                senderObj.Address or "N/A",
                senderObj.Amount or "N/A",
                senderObj.Status or "N/A",
                senderObj.PaidTimestamp or "N/A"
            ))
        end
    else
        print("Error: Senders is not a table. Actual type: " .. type(senders))
    end

    if type(receivers) == "table" then
        print("Receivers list:")
        for i, receiverObj in ipairs(receivers) do
            
            print(string.format(
                "Receiver %d: Name: %s, Address: %s, Amount: %s, Status: %s, ScheduledTimestamp: %s",
                i,
                receiverObj.Name or "N/A",
                receiverObj.Address or "N/A",
                receiverObj.Amount or "N/A",
                receiverObj.Status or "N/A",
                receiverObj.ScheduledTimestamp or "N/A"
            ))
        end
    else
        print("Error: Receivers is not a table. Actual type: " .. type(receivers))
    end

    if type(signers) == "table" then
        print("Signers list:")
        for i, signerObj in ipairs(signers) do
            
            print(string.format(
                "Signer %d: Name: %s, Address: %s, Status: %s, Timestamp: %s",
                i,
                signerObj.Name or "N/A",
                signerObj.Address or "N/A",
                signerObj.Status or "N/A",
                signerObj.Timestamp or "N/A"
            ))
        end
    else
        print("Error: Signers is not a table. Actual type: " .. type(signers))
    end

    local invoice = {
        Timestamp = timestamp_seconds,
        InvoiceNote = invoice_note,
        Amount = invoice_amount,
        Status = "Pending",
        Senders = senders,
        Receivers = receivers,
        Signers = signers,
        InvoiceType = invoice_type,
        Category = category,
        Owner = owner,
        OwnerName = owner_name,
        PaidTimestamp = timestamp_seconds
    }

    insertInvoice(invoice)

    local invoice_json = json.encode(invoice)
    Send({ Target = msg.From, Data = invoice_json })
end

function ProcessFunds(invoice, invoice_id, timestamp)
    
    print(" ---------- ProcessFunds  " .. invoice_id .. " ----------")

    local receivers = invoice.Receivers or {}
    local senders = invoice.Senders or {}

    if type(receivers) ~= "table" or #receivers == 0 then
        print("No receivers to process funds for.")
        return
    end

    for _, receiver in ipairs(receivers) do
        local scheduledTimestamp = tonumber(receiver.ScheduledTimestamp or "")
        if not scheduledTimestamp or scheduledTimestamp <= timestamp then
            if receiver.Address and tonumber(receiver.Amount) then
                Send({
                    Target = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8",
                    Action = "Transfer",
                    Quantity = tostring(receiver.Amount),
                    Recipient = receiver.Address
                })
                print(string.format("Funds sent: %s tokens to %s", receiver.Amount, receiver.Address))
            else
                print("Invalid receiver data: Address or Amount is missing.")
            end
        else
            print(string.format("Skipping receiver with ScheduledTimestamp: %s (current timestamp: %s)", scheduledTimestamp, timestamp))
        end
    end

    if type(senders) == "table" then
        print("Updating Senders list:")
        for i, senderObj in ipairs(senders) do
            senderObj.Status = "Paid"
            senderObj.PaidTimestamp = timestamp
            print(string.format(
                "Sender %d updated: Address: %s, Amount: %s, Status: %s, PaidTimestamp: %s",
                i,
                senderObj.Address or "N/A",
                senderObj.Amount or "N/A",
                senderObj.Status or "N/A",
                senderObj.PaidTimestamp or "N/A"
            ))
        end

        local senders_json = json.encode(senders)

        local updateSendersQuery = string.format(
            "UPDATE Invoices SET Senders = '%s' WHERE InvoiceID = '%s';",
            senders_json:gsub("'", "''"),
            invoice_id
        )

        local success = dbAdmin:exec(updateSendersQuery)
        if success then
            print("Senders updated successfully in the database.")
        else
            print("Failed to update senders in the database.")
        end
    else
        print("Error: Senders is not a table. Actual type: " .. type(senders))
    end

    local updateQuery = string.format(
        "UPDATE Invoices SET Status = 'Paid', PaidTimestamp = %d WHERE InvoiceID = '%s';",
        timestamp,
        invoice_id
    )
    local success = dbAdmin:exec(updateQuery)
    if success then
        print(string.format("Invoice %s updated to Paid.", invoice_id))
    else
        print(string.format("Failed to update Invoice %s to Paid.", invoice_id))
    end

    print("Funds processing complete.")
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
    matchingSender.PaidTimestamp = timestamp_seconds

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

Handlers.add("CreateNewInvoice", "Create-New-Invoice", function (msg)
    print("CreateNewInvoice" .. msg.Data )

    local data = json.decode(msg.Data)
    local timestamp_ms = msg["Timestamp"]
    local timestamp_seconds = math.floor(timestamp_ms / 1000)
    local invoice_note = data.Note
    local invoice_amount = data.Amount
    local senders = data.Senders
    local receivers = data.Receivers
    local invoice_type = data.InvoiceType or "Payment"
    local category = data.Category or "Uncategorized"
    local owner = msg.From
    local owner_name = data.OwnerName or "Unknown"

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
        Timestamp = timestamp_seconds,
        InvoiceNote = invoice_note,
        Amount = invoice_amount,
        Status = "Pending",
        Senders = senders,
        Receivers = receivers,
        Signers = "",
        InvoiceType = invoice_type,
        Category = category,
        Owner = owner,
        OwnerName = owner_name
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

    local query = string.format("SELECT * FROM Invoices WHERE InvoiceID = '%s' AND Owner = '%s';", invoiceId, senderWallet)
    local result = dbAdmin:exec(query)

    if #result == 0 then
        print("No matching invoice found or sender (" .. senderWallet .. ") is not authorized to delete.")
        Send({ Target = msg.From, Data = json.encode({ error = "No matching invoice found or not authorized to delete." }) })
        return
    end

    local invoice = result[1]
    local senders = json.decode(invoice.Senders or "[]")

    if type(senders) == "table" and #senders > 0 then
        print("Refunding senders for invoice: " .. invoiceId)

        for _, senderObj in ipairs(senders) do
            -- Note: "Scheduled" status is not implemented yet, so doesnt work as of 11/25/24
            if (senderObj.Status == "Paid" or senderObj.Status == "Scheduled") and senderObj.Amount and senderObj.Address then
                Send({
                    Target = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8",
                    Action = "Transfer",
                    Quantity = tostring(senderObj.Amount),
                    Recipient = senderObj.Address
                })
                print(string.format("Refunded %s tokens to sender: %s (Status: %s)", senderObj.Amount, senderObj.Address, senderObj.Status))
            else
                print(string.format("Skipping refund for sender: %s (Status: %s)", senderObj.Address or "N/A", senderObj.Status or "N/A"))
            end
        end
    else
        print("No senders to refund for invoice: " .. invoiceId)
    end

    local deleteQuery = string.format("DELETE FROM Invoices WHERE InvoiceID = '%s';", invoiceId)
    local success = dbAdmin:exec(deleteQuery)

    if success then
        print("Invoice " .. invoiceId .. " has been deleted by Owner: " .. senderWallet)
        Send({ Target = msg.From, Data = json.encode({ success = true, message = "Invoice deleted and senders refunded." }) })
    else
        print("Failed to delete invoice: " .. invoiceId)
        Send({ Target = msg.From, Data = json.encode({ error = "Failed to delete invoice." }) })
    end
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

        local signers = json.decode(invoice.Signers or '[]')
        for _, signer in ipairs(signers) do
            if signer.Address == address then
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
    -- print("Matching Invoices: " .. invoices_json)
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

    -- printInvoiceById( invoiceId );

    if #invoice == 0 then
        print("No invoice found with ID: " .. invoiceId)
        Send({ Target = msg.From, Data = json.encode({ error = "No invoice found with the provided ID." }) })
        return
    end

    local invoice_json = json.encode(invoice[1])
    Send({ Target = msg.From, Data = invoice_json })
end)


------ || Signed Invoice || ------

Handlers.add("SignInvoiceById", "Sign-Invoice-By-Id", function (msg)

    local data = json.decode(msg.Data)
    local invoiceId = data.InvoiceID
    local signer = msg.From

    print("SignInvoiceById: " .. invoiceId .. " Signer: " .. signer)

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
    local result = dbAdmin:exec(query)

    if #result == 0 then
        print("No invoice found with ID: " .. invoiceId)
        Send({ Target = msg.From, Data = json.encode({ error = "No invoice found with the provided ID." }) })
        return
    end

    local invoice = result[1]
    local signers = json.decode(invoice.Signers or "[]")
    invoice.Receivers = json.decode(invoice.Receivers or "[]")
    invoice.Senders = json.decode(invoice.Senders or "[]")
    local timestamp_ms = msg["Timestamp"]
    local timestamp_seconds = math.floor(timestamp_ms / 1000)

    local signerFound = false

    for _, signerObj in ipairs(signers) do
        if signerObj.Address == signer then
            signerObj.Status = "Signed"
            signerObj.Timestamp = timestamp_seconds
            signerFound = true
            break
        end
    end

    if not signerFound then
        print("Signer not found in the invoice.")
        Send({ Target = msg.From, Data = json.encode({ error = "Signer not found in the invoice." }) })
        return
    end

    local updatedSignersJson = json.encode(signers)
    local updateSignersQuery = string.format([[
      UPDATE Invoices 
      SET Signers = '%s'
      WHERE InvoiceID = "%s";
    ]], updatedSignersJson:gsub("'", "''"), invoiceId)

    local success = dbAdmin:exec(updateSignersQuery)
    if success then
        print("Signers updated successfully in the database.")
    else
        print("Failed to update signers in the database.")
    end

    local allSigned = true
    for _, signerObj in ipairs(signers) do
        if signerObj.Status ~= "Signed" then
            allSigned = false
            break
        end
    end

    if allSigned then
        print("All signers have signed. Processing funds...")
        ProcessFunds(invoice, invoiceId, timestamp_seconds)
    else
        print("Not all signers have signed yet.")
    end

    Send({ Target = msg.From, Data = "Success" })

    -- Send({ Target = msg.From, Data = json.encode({ success = true, message = "Signer updated successfully." }) })
end)


Handlers.add( "Credit-Notice", Handlers.utils.hasMatchingTag("Action", "Credit-Notice"), function (msg)

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

        -- If incorrect amount or id, then add to a LOOSE_PAYMENTS db
    end
)


Handlers.add(
    "Debit-Notice",
    Handlers.utils.hasMatchingTag("Action", "Debit-Notice"),
    function (msg) 
        print("Debit-Notice: " .. msg.Quantity)
    end
)

------ || Crons || ------

Handlers.add( "CronTick", Handlers.utils.hasMatchingTag("Action", "Cron"),
  function (msg)

    local timestamp_ms = msg["Timestamp"]
    local timestamp_seconds = math.floor(timestamp_ms / 1000)

    ProcessScheduled( timestamp_seconds )
  end
)

function ProcessScheduled( timestamp)

    print("--------------- ProcessScheduled ---------------")

    local query = [[
        SELECT * FROM Invoices 
        WHERE InvoiceType = "PrePaidScheduled" AND Status = "Pending";
    ]]
    local results = dbAdmin:exec(query)

    if #results == 0 then
        return
    end

    print("Found Pending PrePaidScheduled invoices:")
    for _, invoiceRow in ipairs(results) do
        print(string.format("Processing InvoiceID: %s, Status: %s", 
            invoiceRow.InvoiceID or "N/A", 
            invoiceRow.Status or "N/A"
        ))

        local invoice = {
            InvoiceID = invoiceRow.InvoiceID,
            Timestamp = invoiceRow.Timestamp,
            InvoiceNote = invoiceRow.InvoiceNote,
            Amount = invoiceRow.Amount,
            Status = invoiceRow.Status,
            Senders = json.decode(invoiceRow.Senders or "[]"),
            Receivers = json.decode(invoiceRow.Receivers or "[]"),
            InvoiceType = invoiceRow.InvoiceType,
            Category = invoiceRow.Category,
            Owner = invoiceRow.Owner,
            OwnerName = invoiceRow.OwnerName,
        }

        local eligibleReceivers = {}
        for _, receiver in ipairs(invoice.Receivers) do
            local scheduledTimestamp = tonumber(receiver.ScheduledTimestamp or 0)
            if scheduledTimestamp > 0 and timestamp >= scheduledTimestamp then
                table.insert(eligibleReceivers, receiver)
            else
                print(string.format(
                    "Skipping receiver: Address=%s, ScheduledTimestamp=%s, CurrentTimestamp=%d",
                    receiver.Address or "N/A",
                    receiver.ScheduledTimestamp or "N/A",
                    timestamp
                ))
            end
        end

        if #eligibleReceivers > 0 then
            invoice.Receivers = eligibleReceivers
            print(string.format("Processing funds for InvoiceID: %s", invoiceRow.InvoiceID))
            ProcessFunds(invoice, invoiceRow.InvoiceID, timestamp)
        else
            print(string.format("No eligible receivers for InvoiceID: %s", invoiceRow.InvoiceID))
        end
    end

    print("ProcessScheduled completed")
end

------ || Admin Handlers || ------

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

    print("Cleaning Tables")

    local query = string.format("DROP TABLE IF EXISTS %s;", "Invoices")
    dbAdmin:exec(query)
end)

Handlers.add("AdminDeleteInvoice", "Admin-Delete-Invoice", function(msg)

    -- admin only
    if msg.From ~= ao.id then
        print("Access Denied: Not an admin.")
        return
    end

    print("AdminDeleteInvoice triggered.")

    local invoiceId = msg.ID

    local query = string.format("SELECT * FROM Invoices WHERE InvoiceID = '%s';", invoiceId)
    local invoice = dbAdmin:exec(query)

    if #invoice == 0 then
        print("Invoice not found: " .. invoiceId)
        Send({ Target = msg.From, Action = "Admin-Delete-Invoice", Error = "No invoice found with the provided InvoiceID." })
        return
    end

    local deleteQuery = string.format("DELETE FROM Invoices WHERE InvoiceID = '%s';", invoiceId)
    dbAdmin:exec(deleteQuery)

    print("Invoice " .. invoiceId .. " has been deleted by admin.")
    Send({ Target = msg.From, Action = "Admin-Delete-Invoice", Success = true, Message = "Invoice deleted successfully." })
end)

