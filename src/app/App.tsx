import MotoCoLogistics from './MotoCoLogistics.jsx';
import SecureLoginBridge from './SecureLoginBridge.jsx';
import ZohoDealBridge from './ZohoDealBridge.jsx';
import DriverWorkflowBridge from './DriverWorkflowBridge.jsx';
import DriverPickupOutcomeBridge from './DriverPickupOutcomeBridge.jsx';
import DriverDeliveryOutcomeBridge from './DriverDeliveryOutcomeBridge.jsx';
import ClientOrderDateBridge from './ClientOrderDateBridge.jsx';

export default function App() {
  return (
    <SecureLoginBridge>
      <ZohoDealBridge>
        <MotoCoLogistics />
        <DriverWorkflowBridge />
        <DriverPickupOutcomeBridge />
        <DriverDeliveryOutcomeBridge />
        <ClientOrderDateBridge />
      </ZohoDealBridge>
    </SecureLoginBridge>
  );
}
