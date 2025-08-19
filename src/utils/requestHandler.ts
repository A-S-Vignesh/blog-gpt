export const getRequest = async (url:string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("GET Request failed:", error);
    throw error; // Propagate the error to be handled by the caller
  }
};

export const postRequest = async (url:string, payload:object) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("POST Request failed:", error);
    throw error; // Propagate the error to be handled by the caller
  }
};
