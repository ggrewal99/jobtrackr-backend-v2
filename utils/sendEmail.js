const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
	try {
		const transporter = nodemailer.createTransport({
			service: 'Gmail',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		const mailOptions = {
			from: '"Jobtrackr" <no-reply@jobtrackr.com>',
			to: options.email,
			subject: options.subject,
			html: options.message,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log('Email sent:', info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error('Error sending email:', error);
		return { success: false, error: error.message };
	}
};

module.exports = sendEmail;
