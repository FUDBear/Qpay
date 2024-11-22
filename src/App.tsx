import { HashRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import About from "./About";
import InvoicesTable from './Components/InvoicesTable';
import InvoiceDetails from './Components/InvoiceDetails';
import InvoiceCreation from "./Components/InvoiceCreation";
import InvoiceSelectMenu from "./Components/InvoiceSelectMenu";
import WalletButton from "./Components/WalletButton";
import BalanceButton from "./Components/BalanceButton";
import SendPaidInvoiceCreation from "./Components/SendPaidInvoiceCreation";
import ScheduledPaidInvoiceCreation from "./Components/ScheduledPaidInvoiceCreation";

function App() {
	return (
		<HashRouter>
			<Routes>
				<Route path={"/"} element={<HomePage />} />
				<Route path={"/about/"} element={<About />} />
				<Route path=":id" element={<InvoiceDetails />} />
				<Route path="/invoicecreation/" element={<InvoiceSelectMenu />} />
				<Route path="/invoicecreation/send" element={<SendPaidInvoiceCreation />} />
				<Route path="/invoicecreation/request" element={<InvoiceCreation />} />
				<Route path="/invoicecreation/scheduled_payment" element={<ScheduledPaidInvoiceCreation />} />
			</Routes>

			<div className="absolute top-4 right-4">
				<WalletButton />
			</div>

			{/* <div className="absolute bottom-4 right-4">
				<BalanceButton />
			</div> */}

		</HashRouter>
	);
}

export default App;
