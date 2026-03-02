import { formatToIST } from "../utils/timeFormatter";

export default function ISTTime({ value }) {
  return <>{formatToIST(value)}</>;
}