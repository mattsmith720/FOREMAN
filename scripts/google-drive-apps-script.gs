/**
 * Google Drive → Foreman ingest webhook
 *
 * Setup:
 * 1. Create a shared folder e.g. "Foreman Site Videos" — tradie uploads MP4/MOV here on phone.
 * 2. In Google Drive: Extensions → Apps Script → paste this file.
 * 3. Set Script properties:
 *    - FOREMAN_WEBHOOK_URL = https://foreman-api-y31r.onrender.com/ingest/drive-webhook
 *    - FOREMAN_INGEST_SECRET = same as INGEST_WEBHOOK_SECRET on Render
 * 4. Add trigger: function onDriveUpload, event "On form submit" won't work —
 *    use time-driven trigger every 5 min OR installable trigger on folder (Drive API).
 *
 * Simplest: time-driven trigger every 10 minutes calling syncDriveFolder().
 */

var PROCESSED_PROP = "FOREMAN_PROCESSED_FILE_IDS";

function syncDriveFolder() {
  var folderId = PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID");
  var webhookUrl = PropertiesService.getScriptProperties().getProperty("FOREMAN_WEBHOOK_URL");
  var secret = PropertiesService.getScriptProperties().getProperty("FOREMAN_INGEST_SECRET");

  if (!folderId || !webhookUrl || !secret) {
    throw new Error("Set DRIVE_FOLDER_ID, FOREMAN_WEBHOOK_URL, FOREMAN_INGEST_SECRET in Script properties");
  }

  var processed = JSON.parse(PropertiesService.getScriptProperties().getProperty(PROCESSED_PROP) || "[]");
  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFiles();

  while (files.hasNext()) {
    var file = files.next();
    var id = file.getId();
    if (processed.indexOf(id) !== -1) continue;

    var mime = file.getMimeType();
    if (mime.indexOf("video/") !== 0) continue;

    var downloadUrl = "https://drive.google.com/uc?export=download&id=" + id;
    var payload = {
      fileId: id,
      fileName: file.getName(),
      mimeType: mime,
      byteSize: file.getSize(),
      jobType: "site_video_import",
      downloadUrl: downloadUrl,
    };

    var response = UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      headers: { "x-ingest-webhook-secret": secret },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      processed.push(id);
      PropertiesService.getScriptProperties().setProperty(PROCESSED_PROP, JSON.stringify(processed));
    }
  }
}
