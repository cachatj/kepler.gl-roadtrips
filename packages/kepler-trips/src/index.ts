import { CollectionsPanel } from './components/CollectionsPanel';
import { GPXUploader } from './components/GPXUploader';
import { JoinPanel } from './components/JoinPanel';
import collectionsReducer from './state/collectionsSlice';

export const CollectionsPanelFactory = () => CollectionsPanel;
export const GPXUploaderFactory = () => GPXUploader;
export const JoinPanelFactory = () => JoinPanel;

export { collectionsReducer };
