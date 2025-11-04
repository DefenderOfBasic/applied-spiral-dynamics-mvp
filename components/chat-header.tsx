"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { memo, useEffect, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon, VercelIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

type PixelMapUpdateState = "idle" | "updating" | "failed";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  onUpdatePixelMap,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  onUpdatePixelMap?: (
    setUpdateState: (value: PixelMapUpdateState) => void,
    userId?: string,
    userEmail?: string | null
  ) => Promise<void>;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { data: session } = useSession();

  const { width: windowWidth } = useWindowSize();
  const [updateState, setUpdateState] = useState<PixelMapUpdateState>("idle");

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Button
          className="order-2 ml-auto h-8 px-2 md:order-1 md:ml-0 md:h-fit md:px-2"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          variant="outline"
        >
          <PlusIcon />
          <span className="md:sr-only">New Chat</span>
        </Button>
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          className="order-1 md:order-2"
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      <Button
        className="h-8 cursor-pointer md:flex md:h-fit md:px-2"
        disabled={updateState === "updating"}
        onClick={() =>
          onUpdatePixelMap?.(
            setUpdateState,
            session?.user?.id,
            session?.user?.email
          )
        }
        variant={updateState === "failed" ? "destructive" : "outline"}
      >
        {updateState === "updating"
          ? "(generating)"
          : updateState === "failed"
            ? "Update Failed - Retry"
            : "Update Pixel Map"}
      </Button>

      {/* <Button
        asChild
        className="order-3 hidden bg-zinc-900 px-2 text-zinc-50 hover:bg-zinc-800 md:ml-auto md:flex md:h-fit dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <Link
          href={"https://vercel.com/templates/next.js/nextjs-ai-chatbot"}
          rel="noreferrer"
          target="_noblank"
        >
          <VercelIcon size={16} />
          Deploy with Vercel
        </Link>
      </Button> */}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.onUpdatePixelMap === nextProps.onUpdatePixelMap
  );
});
