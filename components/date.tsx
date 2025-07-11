import { format } from "date-fns";

export default function DateComponent({
  dateString,
}: {
  dateString: string | undefined;
}) {
  if (!dateString) return;
  return (
    <time dateTime={dateString}>
      {format(new Date(dateString), "LLLL	d, yyyy")}
    </time>
  );
}
