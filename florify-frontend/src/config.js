const API_BASE_URL = "https://o8tdae1gpj.execute-api.eu-north-1.amazonaws.com";
// add /dev (or /prod if you changed the stage)

export default {
  SIGNUP_URL: `${API_BASE_URL}/signup`,
  LOGIN_URL: `${API_BASE_URL}/login`,
  CONFIRM_URL: `${API_BASE_URL}/confirm`,
  RESEND_URL: `${API_BASE_URL}/resend`,
};
