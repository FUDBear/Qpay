import { HashRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import About from "./About";
import InvoicesTable from './Components/InvoicesTable';
import InvoiceDetails from './Components/InvoiceDetails';
import InvoiceCreation from "./Components/InvoiceCreation";
import WalletButton from "./Components/WalletButton";

function App() {
	return (
		<HashRouter>
			<Routes>
				<Route path={"/"} element={<HomePage />} />
				<Route path={"/about/"} element={<About />} />
				<Route path=":id" element={<InvoiceDetails />} />
				<Route path="/invoicecreation/" element={<InvoiceCreation />} />
			</Routes>

			{/* Wallet Button in Top Right Corner */}
			<div className="absolute top-4 right-4">
				<WalletButton />
			</div>

		</HashRouter>
	);
}

export default App;
