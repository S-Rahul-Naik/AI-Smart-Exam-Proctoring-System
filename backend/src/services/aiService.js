import axios from 'axios';

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
    console.error('Phone detection error:', error);
    return { detected: false, error: error.message };
  }
};

export const sendAlertNotification = async (adminEmail, alertData) => {
  try {
    // Integrate with email service (Nodemailer, SendGrid, etc.)
    console.log(`Alert notification sent to ${adminEmail}:`, alertData);
    // Email sending logic here
  } catch (error) {
    console.error('Notification error:', error);
  }
};
