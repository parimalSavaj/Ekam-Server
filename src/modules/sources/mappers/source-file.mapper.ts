import { SourceType } from "../../../domain/enums/source-type.enum.js";

/** What an accepted file extension means for the source: its type and the content type stored with it. */
export type AcceptedFileKind = {
  type: SourceType.PDF | SourceType.TEXT_FILE;
  contentType: string;
};

// File upload accepts PDFs, and text files in the formats the pipeline will read as plain text.
// CSV is a text file here; Excel and Google Sheets are spreadsheets and belong to a later feature.
const ACCEPTED_EXTENSIONS: Readonly<Record<string, AcceptedFileKind>> = {
  pdf: { type: SourceType.PDF, contentType: "application/pdf" },
  txt: { type: SourceType.TEXT_FILE, contentType: "text/plain" },
  md: { type: SourceType.TEXT_FILE, contentType: "text/markdown" },
  markdown: { type: SourceType.TEXT_FILE, contentType: "text/markdown" },
  csv: { type: SourceType.TEXT_FILE, contentType: "text/csv" },
  json: { type: SourceType.TEXT_FILE, contentType: "application/json" },
  html: { type: SourceType.TEXT_FILE, contentType: "text/html" },
  htm: { type: SourceType.TEXT_FILE, contentType: "text/html" },
};

/** Maps an uploaded file to the source type and content type it is stored with. */
export class SourceFileMapper {
  /** The accepted formats, worded for error messages. Keep in step with ACCEPTED_EXTENSIONS. */
  static readonly ACCEPTED_DESCRIPTION = "PDF, TXT, Markdown, CSV, JSON or HTML";

  private constructor() {}

  /**
   * Maps a file name to its kind by extension. Returns null when the extension is missing or not
   * accepted. The content is checked separately, because an extension alone proves nothing.
   */
  static fromFileName(fileName: string): AcceptedFileKind | null {
    const dot = fileName.lastIndexOf(".");
    if (dot < 0 || dot === fileName.length - 1) return null;
    return ACCEPTED_EXTENSIONS[fileName.slice(dot + 1).toLowerCase()] ?? null;
  }
}
