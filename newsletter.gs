function doPost(e) {
  try {
    const email = e.parameter.email;
    const source = e.parameter.source || 'unknown';
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email address');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Newsletter');
    sheet.appendRow([new Date(), email, source]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Thank you for subscribing!'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}