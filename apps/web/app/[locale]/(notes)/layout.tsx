import { WebNotesProvider } from "../../../components/web-notes-provider";

interface NotesGroupLayoutProps {
  children: React.ReactNode;
}

export default function NotesGroupLayout({ children }: NotesGroupLayoutProps) {
  return <WebNotesProvider>{children}</WebNotesProvider>;
}
