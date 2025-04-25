export const getRequest = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    return "GET Request failed" + error;
  }
};

export const postRequest = async (url, payload) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return "POST Request failed" + error;
  }
};
