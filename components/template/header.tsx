import { getCurrentUser } from "@/lib/supabase/get-user";
import { Avatar } from "../common/avatar";
import { ModeToggle } from "../common/mode-toggle";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="container flex justify-between items-center px-3 py-5 mx-auto relative border-b mb-3">
      <Avatar
        avatar={user?.avatar_url}
        name={user?.full_name}
        showName
        isFallback="initial"
        size="md"
      />

      <ModeToggle />
    </header>
  );
}
