const { supabase } = require('../services/supabase');
const logger = require('../utils/logger');
const { sendSupportReportEmail } = require('../services/emailService');

const handleGetUsers = async (req, res) => {
  try {
    // Only the service role key can call admin endpoints
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      logger.error(`[Admin] Failed to fetch users: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      users: data.users
    });
  } catch (error) {
    logger.error(`[Admin] Exception fetching users: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const handleReportProblem = async (req, res) => {
  try {
    const { userId, userEmail, userName, reportText, platform, appVersion } = req.body;

    if (!reportText || !reportText.trim()) {
      return res.status(400).json({ success: false, message: 'Report text is required.' });
    }

    logger.info(`[Support] New report submitted by ${userEmail || userName || 'User'}: "${reportText.substring(0, 60)}..."`);

    // 1. Insert into Supabase support_reports table
    try {
      await supabase.from('support_reports').insert([{
        user_id: userId || null,
        user_email: userEmail || 'anonymous',
        user_name: userName || 'Studio User',
        report_text: reportText.trim(),
        platform: platform || 'mobile',
        app_version: appVersion || '2.4.0',
        created_at: new Date().toISOString()
      }]);
    } catch (dbErr) {
      logger.warn(`[Support] Supabase record notice: ${dbErr.message}`);
    }

    // 2. Dispatch real-time email alert to Admin
    sendSupportReportEmail({
      userId,
      userEmail,
      userName,
      reportText: reportText.trim(),
      platform
    }).catch(e => logger.warn(`[Support Email Catch] ${e.message}`));

    return res.status(200).json({
      success: true,
      message: 'Support report received and recorded successfully.'
    });
  } catch (error) {
    logger.error(`[Support] Error processing report: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Could not submit report.' });
  }
};

module.exports = {
  handleGetUsers,
  handleReportProblem
};
