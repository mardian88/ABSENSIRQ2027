import { getAlumniList } from "./actions";
import { AlumniClient } from "./AlumniClient";

export default async function AlumniPage() {
  const alumniList = await getAlumniList();

  return (
    <div className="w-full max-w-screen-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <AlumniClient alumniList={alumniList} />
    </div>
  );
}
