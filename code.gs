function doGet(e) {
  const response = { success: false, message: "", timestamp: new Date().toISOString() };
  
  try {
    if (!e?.parameter) throw new Error("Invalid request format");
    
    const params = e.parameter;
    const required = ['productName', 'price', 'count', 'phone', 'name', 'location'];
    const missing = required.filter(field => !params[field]);
    if (missing.length) throw new Error(`Missing fields: ${missing.join(', ')}`);
    
    const count = parseInt(params.count);
    const price = parseFloat(params.price);
    if (isNaN(count) || isNaN(price)) throw new Error("Invalid numbers");
    
    const orderData = {
      orderId: `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`,
      timestamp: new Date(),
      name: params.name.replace(/[<>"']/g, ''),
      phone: params.phone.replace(/[<>"']/g, ''),
      products: params.productName.replace(/,\s/g, "\n"),
      itemCount: count,
      price: price, // Using price directly (no total price calculation)
      location: params.location.replace(/[<>"']/g, '')
    };
    
    // Save to sheet with only the necessary columns
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders") || 
                 SpreadsheetApp.getActiveSpreadsheet().insertSheet("Orders");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Order ID","Timestamp","Customer","Phone","Products","Qty","Price","Location"]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold");
    }
    sheet.appendRow([
      orderData.orderId, 
      orderData.timestamp, 
      orderData.name, 
      orderData.phone, 
      orderData.products, 
      orderData.itemCount, 
      `${orderData.price}dt`, // Just the price, no total
      orderData.location
    ]);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 8).setBorder(true, true, true, true, true, true);
    
    // Send email with inline content (no template file needed)
    const formattedDate = Utilities.formatDate(orderData.timestamp, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #d35400;">New Order #${orderData.orderId}</h2>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Customer:</strong> ${orderData.name}</p>
          <p><strong>Phone:</strong> ${orderData.phone}</p>
          <p><strong>Products:</strong><br>${orderData.products.replace(/\n/g, "<br>")}</p>
          <p><strong>Price:</strong> ${orderData.price}dt (${orderData.itemCount} items)</p>
          <p><strong>Location:</strong> ${orderData.location}</p>
        </div>
        <p style="color: #777; font-size: 0.9em;">Received: ${formattedDate}</p>
      </div>
    `;
    
    MailApp.sendEmail({
      to: "contact@ali-cheikh.com",
      subject: `📦 New Order #${orderData.orderId}`,
      htmlBody: emailBody
    });
    
    // Success response
    response.success = true;
    response.message = "Order processed successfully";
    response.orderId = orderData.orderId;
    
  } catch (error) {
    console.error(error);
    MailApp.sendEmail({
      to: "contact@ali-cheikh.com",
      subject: "🚨 Order Processing Error",
      body: `Error: ${error.message}\n\nOrder Data: ${JSON.stringify(e?.parameter)}`
    });
    response.message = error.message;
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({ 'Access-Control-Allow-Origin': '*' });
}

// Test endpoint
function doGetTest() {
  return ContentService.createTextOutput("Order processing system is operational");
}