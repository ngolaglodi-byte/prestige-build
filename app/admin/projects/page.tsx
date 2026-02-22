// app/admin/projects/page.tsx
import { db } from "@/db/client";
import { projects, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminProjectsPage() {
  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      userId: projects.userId,
      userEmail: users.email,
      userName: users.name,
    })
    .from(projects)
    .leftJoin(users, eq(projects.userId, users.id));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Projects Management</h1>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">Project</th>
            <th className="p-4">Owner</th>
            <th className="p-4">Created</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {allProjects.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-4">
                <div className="font-semibold">{p.name}</div>
                <div className="text-gray-500 text-sm">
                  {p.description ?? "No description"}
                </div>
              </td>

              <td className="p-4">
                <div>{p.userName ?? "Unknown"}</div>
                <div className="text-gray-500 text-sm">{p.userEmail}</div>
              </td>

              <td className="p-4">
                {new Date(p.createdAt).toLocaleDateString()}
              </td>

              <td className="p-4">
                <form action="/api/admin/projects/delete" method="POST">
                  <input type="hidden" name="projectId" value={p.id} />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
