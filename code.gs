function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Log the incoming request for debugging
    console.log("Received order data:", JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.customer || !data.items || data.items.length === 0) {
      throw new Error("Invalid order data: missing customer or items");
    }
    
    // Process the order data
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const timestamp = new Date();
    const orderId = Utilities.getUuid().substring(0, 8).toUpperCase();
    
    // Format order details for spreadsheet
    const customer = data.customer;
    const items = data.items.map(item => {
      return {
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        subtotal: (item.price * item.quantity).toFixed(2)
      };
    });
    
    const total = data.total.toFixed(2);
    
    // Prepare row data for spreadsheet
    const rowData = [
      timestamp,                     // Timestamp
      orderId,                       // Order ID
      customer.name,                 // Customer Name
      customer.email,                // Customer Email
      customer.phone,                // Customer Phone
      customer.address,              // Shipping Address
      items.length,                  // Number of Items
      total,                         // Order Total
      "",                            // Status (empty initially)
      JSON.stringify(items)          // Full item details as JSON
    ];
    
    // Add to spreadsheet
    sheet.appendRow(rowData);
    
    // Format and send email notification
    sendOrderEmail(orderId, customer, items, total);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Order processed successfully",
      orderId: orderId
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error("Error processing order:", error);
    
    // Send error notification
    sendErrorEmail(error, e ? e.postData.contents : "No request data");
    
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message,
      details: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendOrderEmail(orderId, customer, items, total) {
  try {
    // Format items for email
    const itemsHtml = items.map(item => `
      <tr>
        <td>${item.name} (${item.size})</td>
        <td>${item.quantity}</td>
        <td>$${item.price.toFixed(2)}</td>
        <td>$${item.subtotal}</td>
      </tr>
    `).join('');
    
    const subject = `🎌 New Order #${orderId} - $${total}`;
    const htmlBody = `
      <html>
        <head>
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              background-color: #f5f7fa;
              padding: 20px;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            h1 {
              color: #6b46c1;
              text-align: center;
              margin-bottom: 10px;
            }
            .order-id {
              text-align: center;
              color: #888;
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background-color: #6b46c1;
              color: white;
              padding: 12px;
              text-align: left;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #eee;
            }
            .total-row {
              font-weight: bold;
              background-color: #f0e6ff;
            }
            .customer-info {
              background-color: #f8f5ff;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #888;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>New AnimeDrop Order</h1>
            <div class="order-id">Order #${orderId}</div>
            
            <div class="customer-info">
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> ${customer.name}</p>
              <p><strong>Email:</strong> ${customer.email}</p>
              <p><strong>Phone:</strong> ${customer.phone}</p>
              <p><strong>Address:</strong> ${customer.address}</p>
            </div>
            
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                  <td><strong>$${total}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="footer">
              <p>This order was received at ${new Date().toLocaleString()}</p>
              <p>AnimeDrop | Limited Edition Anime Streetwear</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    MailApp.sendEmail({
      to: "<customer.email>",
      bcc: "contact@ali-cheikh.com",
      subject: subject,
      htmlBody: htmlBody,
      noReply: true
    });
    
    console.log("Order confirmation email sent for order:", orderId);
    
  } catch (error) {
    console.error("Failed to send order email:", error);
    throw error; // Re-throw to be caught by the main error handler
  }
}

function sendErrorEmail(error, requestData) {
  try {
    const subject = "❌ ORDER PROCESSING ERROR";
    const body = `
      There was an error processing an order on AnimeDrop:
      
      Error: ${error.message}
      
      Stack Trace:
      ${error.stack}
      
      Request Data:
      ${requestData}
      
      Please check the logs and address this issue immediately.
    `;
    
    MailApp.sendEmail({
      to: "contact@ali-cheikh.com",
      subject: subject,
      body: body
    });
    
    console.log("Error notification email sent");
    
  } catch (emailError) {
    console.error("Failed to send error notification email:", emailError);
  }
}