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

        {/* <div className="p-2 mx-auto">
            <div className="flex items-center">
            <img
              src={"./images/Qpay Logo.svg"}
              alt="QPay Logo"
              className="w-full h-[50px] mb-2"
            />
            </div>
        </div> */}

        <InvoicesTable />

        <div className="flex items-center justify-between mt-4">
            <img src={"./images/Qpay Logo.svg"} alt="QPay Logo" className="w-full h-[30px]" />
          </div>

        
        </> }

        {/* <TesterButtons /> */}
        

        
        
    </div>
    );
}

export default HomePage;
