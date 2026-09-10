import { Badge } from "@/components/ui/badge";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

export const Version = () => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <span>© {new Date().getFullYear()} Filip Stoklasa</span>
    <Badge className="tnum">version: {publicRuntimeConfig?.version}</Badge>
  </div>
);
