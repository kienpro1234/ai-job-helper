import React from "react";

const TestPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">This is a Fast Test Page</h1>
      <p>
        If navigation to this page is instant, it means other pages are slow on
        the server.
      </p>
    </div>
  );
};

export default TestPage;
