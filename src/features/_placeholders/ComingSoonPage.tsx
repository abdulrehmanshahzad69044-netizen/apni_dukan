import { Page } from "../../components/ui/Page";
import { Placeholder } from "../../components/ui/PlaceHolder";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <Page title={title}>
      <Placeholder title={title} />
    </Page>
  );
}