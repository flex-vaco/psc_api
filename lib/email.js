require('dotenv').config();
const fs = require('fs');

const nodemailer = require('nodemailer');
const MAIL_ID = process.env.EMAIL_USER;

const transporter = nodemailer.createTransport({
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PSWD,
    },
    secure: true,
});

const loadTemplate = (templateName, callback) => {
    const templatePath = `./public/email_templates/${templateName}.html`; // Correct path to template
    fs.readFile(templatePath, 'utf8', (err, data) => {
      if (err) {
        return callback(err);
      }
      if (typeof data !== 'string') {
        return callback(new Error('Loaded template is not a string'));
      }
      callback(null, data);
    });
};

const replacePlaceholders = (template, values) => {
    console.log(template);
    let html = template;
    Object.keys(values).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g'); 
      html = html.replace(regex, values[key]);
    });
    const logoUrl = `${process.env.BASE_URL}/uploads/technologies/Logo.png`;
    const logoUrlRegex = new RegExp('{{logourl}}', 'g');
    html = html.replace(logoUrlRegex, logoUrl);
    return html;
};

const sendEmail = (templateName, macroValues, subject, emailTo) => {
  loadTemplate(templateName, (err, template) => {
    if (err) {
      console.log('Error loading template:', err);
      return;
    }

    try {
      const htmlMessage = replacePlaceholders(template, macroValues);
      const mailData = {
        from: MAIL_ID,
        to: emailTo,
        subject: subject,
        text: 'Mail from Flex App.',
        html: htmlMessage,
      };

      // Send the email
      transporter.sendMail(mailData, (error, info) => {
        if (error) {
          return res.status(404).send({error: true, message: error});
        } else {
          return res.status(200).send({message: "Email Sent", user: req.user});
        }
      });

    } catch (replaceError) {
      return res.status(404).send({error: true, message: replaceError});
    }
  });
};

module.exports = {
    transporter,
    MAIL_ID,
    replacePlaceholders,
    loadTemplate,
    sendEmail,
};
