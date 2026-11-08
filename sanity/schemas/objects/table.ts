import { ThListIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const tableRow = defineType({
  name: "tableRow",
  title: "Table Row",
  type: "object",
  fields: [
    defineField({
      name: "cells",
      title: "Cells",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
  ],
});

export const table = defineType({
  name: "table",
  title: "Table",
  type: "object",
  icon: ThListIcon,
  fields: [
    defineField({
      name: "rows",
      title: "Rows",
      type: "array",
      of: [
        defineArrayMember({
          type: "tableRow",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      rows: "rows",
    },
    prepare({ rows }) {
      const rowList = Array.isArray(rows) ? rows : [];
      const rowCount = rowList.length;
      const firstRowCells =
        rowCount > 0 && Array.isArray(rowList[0]?.cells) ? rowList[0].cells : [];
      const headerPreview = firstRowCells
        .map((cell: string) => String(cell || "").replace(/<[^>]+>/g, "").trim())
        .filter(Boolean)
        .join(" | ");

      return {
        title: headerPreview ? `Table: ${headerPreview}` : "Table",
        subtitle: `${rowCount} row${rowCount === 1 ? "" : "s"} (${firstRowCells.length} columns)`,
        media: ThListIcon,
      };
    },
  },
});

export default table;
