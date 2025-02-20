"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dummy");
        const data = await res.json();
        setMessage(data.message);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <main>
      <h1>Next.js Dummy API Example</h1>
      <p>{message ?? "Loading..."}</p>
    </main>
  );
}
