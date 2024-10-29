import { Link } from "react-router-dom";
import React, {useState} from "react";
import { PermissionType } from 'arconnect';
import { useGlobalContext } from './GlobalProvider';
import WalletButton from "./Components/WalletButton";
import TesterButtons from "./Components/TestButtons";
import InvoicesTable from "./Components/InvoicesTable";
import ClipLoader from "react-spinners/ClipLoader";
import Breadcrumbs from "./Components/Breadcrumbs";

function HomePage() {

    const { ADDRESS } = useGlobalContext();
    
    const [loading, setLoading] = useState(false);

    return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">

        { loading && <>
            <div className="sweet-loading">
                <ClipLoader
                color={"#503BC4"}
                loading={loading}
                size={150}
                aria-label="Loading Spinner"
                data-testid="loader" 
                />
            </div>
        </>}
        
        
        { ADDRESS === 'disconnected' ? 
        <></> : <>
        <Breadcrumbs/>
        <InvoicesTable />
        </> }

        {/* <TesterButtons /> */}
        

        
        
    </div>
    );
}

export default HomePage;
