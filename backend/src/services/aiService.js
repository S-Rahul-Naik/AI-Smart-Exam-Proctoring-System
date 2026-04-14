import axios from 'axios';
import logger from '../utils/logger.js';

export const detectPhone = async (imageBuffer) => {
  try {
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer]), 'frame.jpg');

    const response = await axios.post(
      `${process.env.AI_MODEL_PHONE_DETECTION_URL}?api_key=${process.env.ROBOFLOW_API_KEY}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      detected: response.data.predictions && response.data.predictions.length > 0,
      confidence: response.data.predictions?.[0]?.confidence || 0,
      predictions: response.data.predictions || [],
    };
  } catch (error) {
    logger.error('Phone Detection', error.message);
    return { detected: false, error: error.message };
  }
};

export const sendAlertNotification = async (adminEmail, alertData) => {
  try {
    // Integrate with email service (Nodemailer, SendGrid, etc.)
    if (process.env.VERBOSE_DEBUG === 'true') {
      logger.success('Alert', `Notification sent to ${adminEmail}`);
    }
    // Email sending logic here
  } catch (error) {
    logger.error('Alert Notification', error.message);
  }
};
