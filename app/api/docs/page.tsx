import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Documentation for the Car Management API",
}

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <p className="mb-4">
            All API endpoints require authentication. The application uses Supabase Auth for authentication.
          </p>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">POST /api/auth/signout</h3>
            <p>Signs out the current user and redirects to the login page.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Cars</h2>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">GET /api/cars</h3>
            <p className="mb-2">Retrieves all cars for the authenticated user.</p>
            <h4 className="font-medium mt-3 mb-1">Query Parameters:</h4>
            <ul className="list-disc list-inside mb-2">
              <li>
                <code>search</code> (optional): Search term to filter cars by title, description, or tags
              </li>
            </ul>
            <h4 className="font-medium mt-3 mb-1">Response:</h4>
            <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
              {`[
                  {
                    "id": "uuid",
                    "title": "string",
                    "description": "string",
                    "tags": ["string"],
                    "user_id": "uuid",
                    "created_at": "timestamp",
                    "updated_at": "timestamp",
                    "car_images": [
                      {
                        "id": "uuid",
                        "url": "string"
                      }
                    ]
                  }
                ]`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">POST /api/cars</h3>
            <p className="mb-2">Creates a new car for the authenticated user.</p>
            <h4 className="font-medium mt-3 mb-1">Request Body (FormData):</h4>
            <ul className="list-disc list-inside mb-2">
              <li>
                <code>title</code> (required): Title of the car
              </li>
              <li>
                <code>description</code> (required): Description of the car
              </li>
              <li>
                <code>tags</code> (required): Comma-separated list of tags
              </li>
              <li>
                <code>image0</code> to <code>image9</code> (optional): Car images (up to 10)
              </li>
            </ul>
            <h4 className="font-medium mt-3 mb-1">Response:</h4>
            <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
              {`{
                  "success": true,
                  "car": {
                    "id": "uuid",
                    "title": "string",
                    "description": "string",
                    "tags": ["string"],
                    "user_id": "uuid",
                    "created_at": "timestamp",
                    "updated_at": "timestamp"
                  }
                }`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">GET /api/cars/:id</h3>
            <p className="mb-2">Retrieves a specific car by ID for the authenticated user.</p>
            <h4 className="font-medium mt-3 mb-1">Path Parameters:</h4>
            <ul className="list-disc list-inside mb-2">
              <li>
                <code>id</code> (required): ID of the car to retrieve
              </li>
            </ul>
            <h4 className="font-medium mt-3 mb-1">Response:</h4>
            <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
              {`{
                  "id": "uuid",
                  "title": "string",
                  "description": "string",
                  "tags": ["string"],
                  "user_id": "uuid",
                  "created_at": "timestamp",
                  "updated_at": "timestamp",
                  "car_images": [
                    {
                      "id": "uuid",
                      "url": "string"
                    }
                  ]
                }`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">PUT /api/cars/:id</h3>
            <p className="mb-2">Updates a specific car by ID for the authenticated user.</p>
            <h4 className="font-medium mt-3 mb-1">Path Parameters:</h4>
            <ul className="list-disc list-inside mb-2">
              <li>
                <code>id</code> (required): ID of the car to update
              </li>
            </ul>
            <h4 className="font-medium mt-3 mb-1">Request Body (FormData):</h4>
            <ul className="list-disc list-inside mb-2">
              <li>
                <code>title</code> (required): Updated title of the car
              </li>
              <li>
                <code>description</code> (required): Updated description of the car
              </li>
              <li>
                <code>tags</code> (required): Updated comma-separated list of tags
              </li>
              <li>
                <code>imagesToDelete</code> (optional): Comma-separated list of image IDs to delete
              </li>
              <li>
                <code>image0</code> to <code>image9</code> (optional): New car images to add
              </li>
            </ul>
            <h4 className="font-medium mt-3 mb-1">Response:</h4>
            <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
              {`{
  "success": true,
  "car": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "tags": ["string"],
    "user_id": "uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">DELETE /api/cars/:id</h3>
            <p className="mb-2">Deletes a specific car by ID for the authenticated user.</p>
            <h4 className="font-medium mt-3 mb-1">Path Parameters:</h4>
            <ul className="list-disc list-inside mb-2">
              <li>
                <code>id</code> (required): ID of the car to delete
              </li>
            </ul>
            <h4 className="font-medium mt-3 mb-1">Response:</h4>
            <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
              {`{
  "success": true
}`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
}

