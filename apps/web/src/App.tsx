import { formatBuildInfo, type BuildInfo } from '@flowcanvas/graph-model';

interface AppProps {
  readonly buildInfo: BuildInfo;
}

export function App({ buildInfo }: AppProps) {
  return (
    <main>
      <h1>Flowcanvas</h1>
      <p>{formatBuildInfo(buildInfo)}</p>
    </main>
  );
}
