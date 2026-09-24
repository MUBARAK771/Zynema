import Link from "next/link";

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pages = Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]),
  ).filter((page) => page >= 1 && page <= totalPages);

  const pageLink = (page: number) => `/discover?page=${page}`;

  return (
    <div className="flex items-center justify-center gap-2 pt-10 pb-4 border-t border-[#242529] mt-8">
      <Link
        href={pageLink(Math.max(currentPage - 1, 1))}
        aria-disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white ${
          currentPage === 1 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        Previous
      </Link>
      {pages.map((page, index) => (
        <span key={page} className="contents">
          {index > 0 && pages[index - 1] !== page - 1 && (
            <span className="text-zinc-600 px-1">...</span>
          )}
          <Link
            href={pageLink(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`flex w-9 h-9 items-center justify-center rounded-lg text-sm ${
              page === currentPage
                ? "bg-accent text-white font-medium"
                : "text-zinc-400 hover:text-white hover:bg-base-panel"
            }`}
          >
            {page}
          </Link>
        </span>
      ))}
      <Link
        href={pageLink(Math.min(currentPage + 1, totalPages))}
        aria-disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white ${
          currentPage === totalPages ? "pointer-events-none opacity-40" : ""
        }`}
      >
        Next
      </Link>
    </div>
  );
}