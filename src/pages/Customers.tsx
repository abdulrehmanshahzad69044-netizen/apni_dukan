import { useEffect, useState } from "react";

function Customers() {
  const [message, setMessage] = useState(
    "Checking Electron connection...",
  );

  useEffect(() => {
    console.log("Full window:", window);

    console.log(
      "window.electronAPI:",
      window.electronAPI,
    );

    if (!window.electronAPI) {
      setMessage(
        "Electron API is NOT available. Preload bridge failed.",
      );

      return;
    }

    const result =
      window.electronAPI.testConnection();

    setMessage(result);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">
        Customers
      </h1>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <p className="text-lg">
          {message}
        </p>
      </div>
    </div>
  );
}

export default Customers;