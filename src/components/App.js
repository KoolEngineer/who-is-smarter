import React, { Component } from "react";
import Web3 from "web3";
import axios from "axios";
import styled from "styled-components";
import MemoryToken from "../abis/MemoryToken.json";
import wisIcon from "../assets/wis.png";
import "./App.css";

const Badge_Array = [
    {
        name: "gold-badge",
        img: "https://masinfionex.com/wis-badges/season-1/badge-1.png",
    },
    {
        name: "silver-badge",
        img: "https://masinfionex.com/wis-badges/season-1/badge-2.png",
    },
    {
        name: "bronze-badge",
        img: "https://masinfionex.com/wis-badges/season-1/badge-3.png",
    },
];

class App extends Component {
    async componentWillMount() {
        await this.loadWeb3();
        await this.loadBlockchainData();
    }

    async loadWeb3() {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert(
                "Non-Ethereum browser detected. You should consider trying MetaMask!"
            );
        }
    }

    async loadBlockchainData() {
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        this.setState({ account: accounts[0] });

        // Load smart contract
        const networkId = await web3.eth.net.getId();
        const networkData = MemoryToken.networks[networkId];
        if (networkData) {
            const abi = MemoryToken.abi;
            const address = networkData.address;
            const token = new web3.eth.Contract(abi, address);
            this.setState({ token });
            const totalSupply = await token.methods.totalSupply().call();
            this.setState({ totalSupply });
            // Load Tokens
            let balanceOf = await token.methods.balanceOf(accounts[0]).call();
            for (let i = 0; i < balanceOf; i++) {
                let id = await token.methods
                    .tokenOfOwnerByIndex(accounts[0], i)
                    .call();
                let tokenURI = await token.methods.tokenURI(id).call();
                this.setState({
                    tokenURIs: [...this.state.tokenURIs, tokenURI],
                });
            }
        } else {
            alert("Smart contract not deployed to detected network.");
        }
    }

    constructor(props) {
        super(props);
        this.state = {
            account: "0x0",
            token: null,
            totalSupply: 0,
            tokenURIs: [],
            cardArray: [],
            cardsChosen: [],
            cardsChosenId: [],
            cardsWon: [],
            userList: [],
            fetchUserList: true,
        };
    }

    componentDidMount() {
        axios
            .get("https://masinfionex.com/fetchRank.php")
            .then((res) => {
                this.setState({
                    userList: res.data.data,
                    fetchUserList: false,
                });
            })
            .catch((error) => {
                this.setState({ fetchUserList: true });
            });
    }

    handleMintToken = (index) => {
        this.triggerMintToken(index);
    };

    triggerMintToken = (index) => {
        const { userList } = this.state;
        const data = {
            Name: userList[index].userName,
            Points: userList[index].total,
            Rank: userList[index].ranks,
            Season: "WIS-1",
            Badge: `https://masinfionex.com/wis-badges/season-1/badge-${index +
                1}.png`,
        };
        this.state.token.methods
            .mint(this.state.userList[index].Address, JSON.stringify(data))
            .send({ from: this.state.account })
            .on("transactionHash", (hash) => {
                console.log(Badge_Array[index].img.toString());
            });
        axios
            .post("https://api.nft.storage/upload", data, {
                headers: {
                    Authorization:
                        "Bearer " +
                        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDhCNjRFN2YxNDg2QjhmMzU4MEE2OWMzMzVjMjhGMDIwMmI0NTBEN2EiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYyOTcwMzA5OTEzMSwibmFtZSI6Indob19pc19zbWFydGVyIn0.s6POiiernKoQ3_hQYUjG-j_cdDeuUYmMYNvFHYIHbWQ",
                },
            })
            .then((res) => {
                let bodyFormData = new FormData();
                const id = userList[index].userID;
                const cid = res.data.value.cid + ".ipfs.dweb.link";
                const created = res.data.value.created;
                bodyFormData.append("userID", id);
                bodyFormData.append("nft_token", cid);
                bodyFormData.append("nft_created", created);
                axios
                    .post(
                        "https://masinfionex.com/insert-nft-token.php",
                        bodyFormData
                    )
                    .then((res) => {
                        console.log(res.data);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            })
            .catch((error) => {
                console.log(error);
            });
    };

    render() {
        const { userList, fetchUserList } = this.state;
        return (
            <div>
                <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
                    <a
                        className="navbar-brand col-sm-3 col-md-2 mr-0"
                        href="https://play.google.com/store/apps/details?id=com.masinfionex.whoissmarter"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src={wisIcon}
                            width="30"
                            height="30"
                            className="d-inline-block align-top"
                            alt=""
                        />
                        &nbsp; Who is Smarter ?
                    </a>
                    <ul className="navbar-nav px-3">
                        <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
                            <small className="text-muted">
                                <span id="account">{this.state.account}</span>
                            </small>
                        </li>
                    </ul>
                </nav>
                <MainWrapper>
                    <SidebarWrapper>
                        <SidebarTitle>User Dashboard</SidebarTitle>
                        <SidebarOption>WIS NFT Panel</SidebarOption>
                    </SidebarWrapper>
                    <DashboardWrapper>
                        <DashboardHeader>WIS NFT Panel</DashboardHeader>
                        {fetchUserList ? null : (
                            <DashboardBody>
                                <DashboardTable>
                                    {userList &&
                                        userList.map((item, index) => (
                                            <TableRow key={index}>
                                                <UserPic
                                                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8lexlRaPrjsJcKs8REye9s4e6BlXBNK4p-Q&usqp=CAU"
                                                    alt="user-pic"
                                                />
                                                <UserDetails>
                                                    <Cell>
                                                        <AttributeName>
                                                            Name
                                                        </AttributeName>
                                                        <AttributeValue>
                                                            {item.userName}
                                                        </AttributeValue>
                                                    </Cell>
                                                    <Cell>
                                                        <AttributeName>
                                                            Points
                                                        </AttributeName>
                                                        <AttributeValue>
                                                            {item.total}
                                                        </AttributeValue>
                                                    </Cell>
                                                    <Cell>
                                                        <AttributeName>
                                                            Rank
                                                        </AttributeName>
                                                        <AttributeValue>
                                                            {item.ranks}
                                                        </AttributeValue>
                                                    </Cell>
                                                    <Cell>
                                                        <MintToken
                                                            onClick={() =>
                                                                this.handleMintToken(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            Mint Token
                                                        </MintToken>
                                                    </Cell>
                                                </UserDetails>
                                            </TableRow>
                                        ))}
                                    <TableRow></TableRow>
                                </DashboardTable>
                            </DashboardBody>
                        )}
                    </DashboardWrapper>
                </MainWrapper>
            </div>
        );
    }
}

const MainWrapper = styled.div`
    width: 100%;
    height: 100vh;
    background: #f8f8f8;
    display: flex;
`;

const SidebarWrapper = styled.div`
    flex: 1;
    background: #f8f8f8;
    padding-top: 40px;
    margin-right: 4px;
`;

const SidebarTitle = styled.div`
    background: white;
    width: 100%;
    height: 40px;
    font-weight: 500;
    font-size: 20px;
    padding: 6px 12px;
`;

const SidebarOption = styled.div`
    background: white;
    width: 100%;
    height: 40px;
    font-weight: 500;
    display: flex;
    align-items: center;
    padding-left: 12px;
    margin-top: 12px;
    cursor: pointer;
    color: #1b7ced;
`;

const DashboardWrapper = styled.div`
    flex: 5;
    background: #f8f8f8;
`;

const DashboardHeader = styled.div`
    box-sizing: border-box;
    height: 40px;
    background: white;
    margin-bottom: 12px;
    margin-top: 40px;
    font-weight: 500;
    font-size: 20px;
    padding: 6px 12px;
`;

const DashboardBody = styled.div`
    height: calc(100% - 92px);
    background: white;
    padding: 16px;
`;

const DashboardTable = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const TableRow = styled.div`
    flex: 1;
    background: #f8f8f8;
    margin: 6px 0;
    display: flex;
    align-items: center;
    padding: 12px;
`;

const UserPic = styled.img`
    flex-shrink: 0;
    height: 120px;
    width: 120px;
    border-radius: 50%;
    background: white;
    margin-right: 12px;
    padding: 6px;
`;

const UserDetails = styled.div`
    flex: 1;
    height: 100%;
    display: flex;
`;

const Cell = styled.div`
    flex: 1;
    height: 100%;
    margin: 0 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const AttributeName = styled.div`
    height: 40px;
    width: 100%;
    margin-bottom: 12px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    color: #1b7ced;
`;

const AttributeValue = styled.div`
    height: calc(100% - 52px);
    width: 100%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const MintToken = styled.button`
    outline: none;
    border: none;
    width: 120px;
    height: 50px;
    background: #1b7ced;
    border-radius: 4px;
    cursor: pointer;
    color: white;
`;

export default App;
