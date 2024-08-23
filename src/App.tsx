import { useState, useCallback, useMemo } from "react";
import { WebContainer } from "@webcontainer/api";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AutoComplete } from "@/components/autocomplete";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Help } from "@/components/help";

type Vulnerability = {
  name: string;
  severity: "info" | "low" | "moderate" | "high" | "critical";
  isDirect: boolean;
  via: string[];
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable?:
    | {
        name: string;
        version: string;
        isSemVerMajor: boolean;
      }
    | boolean;
};

type Output = {
  auditReportVersion: number;
  vulnerabilities: Record<string, Vulnerability>;
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
  };
};

type Package = {
  package: {
    name: string;
    version: string;
    publisher: {
      username: string;
    };
  };
  searchScore: number;
};

function App() {
  const [webcontainerInstance, setWebcontainerInstance] =
    useState<WebContainer>();

  const [selectedTab, setSelectedTab] = useState<"package" | "package.json">(
    "package"
  );

  const [output, setOutput] = useState<Output | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState<[string, string][] | null>(
    null
  );

  const [queryKey] = useDebounce(searchValue, 500);

  const { data = [] } = useQuery<Package[]>({
    queryKey: ["data", queryKey],
    queryFn: () =>
      fetch(`https://api.npms.io/v2/search/suggestions?q=${searchValue}`).then(
        (res) => res.json()
      ),
    enabled: queryKey.length > 0,
    staleTime: Infinity,
  });

  const bootWebContainer = async () => {
    if (!webcontainerInstance && !loading) {
      setLoading(true);
      try {
        const instance = await WebContainer.boot();
        setWebcontainerInstance(instance);

        return instance;
      } catch (err) {
        console.log(err);
        setError("Failed to initialize WebContainer");
        setLoading(false);
        return;
      }
    }
  };

  const runAudit = useCallback(async () => {
    let instance = webcontainerInstance;
    if (!webcontainerInstance) {
      instance = await bootWebContainer();
    }

    if (!instance || !selectedValue) {
      return;
    }

    setLoading(true);
    setOutput(null);
    setError(null);

    try {
      const dependencies = selectedValue.reduce((acc, [name, version]) => {
        acc[name] = version;
        return acc;
      }, {} as Record<string, string>);

      // Create package.json
      await instance.fs.writeFile(
        "/package.json",
        JSON.stringify({
          name: "npm-package-auditor",
          version: "1.0.0",
          dependencies,
        })
      );

      // Install the package
      const installProcess = await instance.spawn("npm", ["install"]);
      await installProcess.exit;

      // Install the package
      const npmrcWriter = await instance.spawn("sh", [
        "-c",
        'echo "progress=false" > .npmrc',
      ]);
      await npmrcWriter.exit;

      // Run npm audit
      const auditProcess = await instance.spawn("npm", ["audit", "--json"]);
      let allData = "";
      auditProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            allData += data;
          },
        })
      );
      await auditProcess.exit;
      setOutput(JSON.parse(allData));
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : err}`);
    } finally {
      setLoading(false);
    }
  }, [selectedValue]);

  const packages = useMemo(() => {
    return data
      .sort((a, b) => b.searchScore - a.searchScore)
      .map((item) => ({
        label: item.package.name,
        value: item.package.name,
      }));
  }, [data]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== "application/json" || file.name !== "package.json") {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = JSON.parse(e.target?.result as string);

      const dependencies = Object.entries(json.dependencies || {}).map(
        ([name, version]) => [name, version] as [string, string]
      );
      const devDependencies = Object.entries(json.devDependencies || {}).map(
        ([name, version]) => [name, version] as [string, string]
      );

      setSelectedValue([...dependencies, ...devDependencies]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-16 text-center">
      <h1 className="text-2xl font-bold mb-8">NPM Package Auditor</h1>
      <Help />
      <Tabs
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="package">Single Package</TabsTrigger>
          <TabsTrigger value="package.json">Package.json file</TabsTrigger>
        </TabsList>
        <TabsContent value="package">
          <div className="flex space-x-2 mb-4">
            <AutoComplete
              selectedValue={selectedValue?.[0]?.[0] || ""}
              onSelectedValueChange={(value) =>
                setSelectedValue([[value, "latest"]])
              }
              searchValue={searchValue}
              onSearchValueChange={setSearchValue}
              items={packages}
              isLoading={loading}
              emptyMessage={
                searchValue === ""
                  ? "Enter name of the package"
                  : "No package(s) found"
              }
              placeholder="Search and select package..."
            />

            <Button onClick={runAudit} disabled={loading || !selectedValue}>
              {loading ? "Running..." : "Run Audit"}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="package.json">
          <div className="flex flex-col items-center space-x-2 mb-4">
            <label
              htmlFor="file-input"
              className="p-8 rounded-md bg-gray-100 text-gray-700 mb-4 border w-full cursor-pointer"
            >
              <span>
                {selectedValue ? "Change the" : "Upload a"} package.json file
              </span>
            </label>
            <input
              type="file"
              id="file-input"
              className="hidden"
              onChange={handleFileChange}
              accept=".json"
            />

            <Button onClick={runAudit} disabled={loading || !selectedValue}>
              {loading ? "Running..." : "Run Audit"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div>
          <div>
            <svg
              className="mx-auto w-28"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 300 150"
            >
              <path
                fill="none"
                stroke="#787878"
                strokeDasharray="300 385"
                strokeLinecap="round"
                strokeWidth="15"
                d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  calcMode="spline"
                  dur="2"
                  keySplines="0 0 1 1"
                  repeatCount="indefinite"
                  values="685;-685"
                />
              </path>
            </svg>
          </div>
          <p className="px-2 py-4 italic text-gray-700">
            Please wait while package(s) are fetched to run the audit
          </p>
        </div>
      )}

      {output && (
        <div className="bg-gray-100 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
          <h2 className="text-xl font-bold mb-4">Vulnerabilities</h2>
          <table className="w-full">
            <thead>
              <tr className="border">
                <th>Info</th>
                <th>Low</th>
                <th>Moderate</th>
                <th>High</th>
                <th>Critical</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border">
                <td>{output?.metadata?.vulnerabilities?.info}</td>
                <td>{output?.metadata?.vulnerabilities?.low}</td>
                <td>{output?.metadata?.vulnerabilities?.moderate}</td>
                <td>{output?.metadata?.vulnerabilities?.high}</td>
                <td>{output?.metadata?.vulnerabilities?.critical}</td>
              </tr>
            </tbody>
          </table>
          <h2 className="text-xl font-bold my-4">Affected Packages</h2>
          <table className="w-full">
            <thead>
              <tr className="border">
                <th>Package</th>
                <th>Version</th>
                <th>Vulnerabilities</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(output?.vulnerabilities || {}).map(
                ([name, vulnerability]) => (
                  <tr className="border">
                    <td>{name}</td>
                    <td>{vulnerability.range}</td>
                    <td>
                      {vulnerability.effects.map((effect) => (
                        <span key={effect}>{effect}</span>
                      ))}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
