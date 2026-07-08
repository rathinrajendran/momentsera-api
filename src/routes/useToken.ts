"use client";

import { useEffect, useState } from "react";

export function useToken() {
  const [token, setToken] = useState("");

  useEffect(() => {
    const updateToken = () => {
      setToken(localStorage.getItem("token") || "");
    };

    updateToken();

    window.addEventListener("storage", updateToken);

    return () => {
      window.removeEventListener("storage", updateToken);
    };
  }, []);

  return token;
}
