import { format, isValid } from "date-fns";

export default function DateComponent({
  dateString,
}: {
  dateString: string | undefined;
}) {
  if (!dateString) return null;
  const parsedDate = new Date(dateString);
  if (!isValid(parsedDate)) {
    return <time dateTime={dateString}>{dateString}</time>;
  }
  return (
    <time dateTime={dateString}>
      {format(parsedDate, "LLLL d, yyyy")}
    </time>
  );
}
