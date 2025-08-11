"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/types/user";
import { icons } from "@/utils/icons";
import { DialogBill } from "./dialog-bill";
import { DialogTransaction } from "./dialog-transaction";
import { Button } from "./ui/button";

export function ButtonActions({ user }: { user: User | null }) {
  const [open, setOpena] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpena}>
      <DropdownMenuTrigger asChild>
        <Button className="bg-primary/80 hover:bg-primary">
          {icons.plusCircle(" h-4 w-4")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="flex flex-col space-y-2">
        {/* <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator /> */}
        <DropdownMenuItem asChild>
          <DialogTransaction user={user} />
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <DialogBill user={user} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
