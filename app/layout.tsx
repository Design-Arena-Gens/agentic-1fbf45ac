export const metadata = {
  title: "Door Cam - Dog Eating Burger",
  description: "Stylized door camera animation: dog eating a burger outside the door.",
};

import "./globals.css";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
