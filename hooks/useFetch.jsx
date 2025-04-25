"use client";

import { useEffect, useState } from "react";

const useFetch = (url) => {
  const [loading, setloading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async (url) => {
    try {
      setloading(true);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch data!");
      }
      const data = await response.json();
      setData(data);
    } catch (error) {
      setError(`Failed to fetch data!- ${error}`);
    } finally {
      setloading(false);
    }
  };
  useEffect(() => {
    fetchData(url);
  }, []);
  return { data, loading, error };
};

export default useFetch;
