"use client";
import { usePathname } from "next/navigation";
import type React from "react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type User = {
  id: string;
  name: string;
  email?: string;
  // ... adicione o que precisar
};

type InfoDashboardContextType = {
  urlBase: string;
  userId: string;
  setUrlBase: (url: string) => void;
  setUserId: (user: string) => void;
};

type Props = { children: ReactNode };

const InfoDashboardContext = createContext<
  InfoDashboardContextType | undefined
>(undefined);

export const InfoDashboardProvider: React.FC<Props> = ({ children }) => {
  const [urlBase, setUrlBase] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const initialLoad = useRef(true);
  const pathName = usePathname();

  useEffect(() => {
    if (initialLoad.current) {
      const regex = /^\/dashboard\/([a-f0-9-]{36})/;
      const match = pathName.match(regex);
      if (match) {
        const userId = match[1];
        setUrlBase(`/dashboard/${userId}`);
        console.log(userId);
        setUserId(userId);
      } else {
        setUrlBase("");
        setUserId("");
      }
      initialLoad.current = false;
    }
  }, [pathName.match]);

  return (
    <InfoDashboardContext.Provider
      value={{ urlBase, userId, setUrlBase, setUserId }}
    >
      {children}
    </InfoDashboardContext.Provider>
  );
};

export function useInfoDashboard() {
  const context = useContext(InfoDashboardContext);
  if (!context) {
    throw new Error(
      "useInfoDashboard must be used within InfoDashboardProvider"
    );
  }
  return context;
}
