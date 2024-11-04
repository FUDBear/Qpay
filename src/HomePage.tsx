import { Link } from "react-router-dom";
import React, {useState} from "react";
import { PermissionType } from 'arconnect';
import { useGlobalContext } from './GlobalProvider';
import WalletButton from "./Components/WalletButton";
import TesterButtons from "./Components/TestButtons";
import InvoicesTable from "./Components/InvoicesTable";
import ClipLoader from "react-spinners/ClipLoader";
import Breadcrumbs from "./Components/Breadcrumbs";
import {
    Rive,
    useRive,
    useStateMachineInput,
    Fit,
    Alignment,
    EventType,
    RiveEventType
} from "@rive-app/react-canvas";

function HomePage() {

    const { ADDRESS } = useGlobalContext();
    
    const [loading, setLoading] = useState(false);

    const {
        rive,
        setCanvasRef,
        setContainerRef,
        canvas: canvasRef,
        container: canvasContainerRef,
      } = useRive(
        {
          src: "./animations/qpay.riv",
          artboard: "Main_AB",
          stateMachines: "Main_SM",
          autoplay: true,
          onLoad: () => {
            console.log("Rive loaded!");
          },
          onPlay: () => {
            console.log('Animation is playing..');
          }
        },
        {
          shouldResizeCanvasToContainer: true,
        }
      );

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
        <>
        <div 
              ref={setContainerRef} 
              className="w-1/2 h-1/2 bg-transparent flex justify-center items-center mx-auto"
            >
              <canvas
                ref={setCanvasRef}
                className="w-full h-full bg-transparent block relative max-h-screen max-w-screen align-top"
                aria-label="Dog haz coin?"
              ></canvas>
            </div>
        </> : <>
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
