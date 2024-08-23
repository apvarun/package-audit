import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Help = () => {
  return (
    <Dialog>
      <DialogTrigger>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="fixed top-4 right-4 h-6 w-6 cursor-pointer text-gray-600 hover:text-gray-900"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-4">How it works</DialogTitle>
          <DialogDescription>
            <p className="mb-4">
              This tool uses the{" "}
              <a
                href="https://docs.npmjs.com/cli/v8/commands/npm-audit"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                npm audit
              </a>{" "}
              command to scan your package.json for vulnerabilities. It then
              displays the results in a table.
            </p>
            <p className="mb-4">
              To run the audit, simply select the package(s) you want to scan
              and click the "Run Audit" button. The tool will then run the audit
              and display the results.
            </p>
            <p className="mb-4">
              The tool also displays a list of affected packages and the
              vulnerabilities they are affected by. This can help you identify
              which packages are at risk of having vulnerabilities.
            </p>
            <hr className="my-4" />
            <p className="mb-4">
              The tool uses WebContainers to run the npm audit command. This
              allows the tool to run the audit command in a secure and isolated
              environment, ensuring that the audit results are accurate and
              reliable.
            </p>
            <p className="mb-4">This project is for educational purposes only.</p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
