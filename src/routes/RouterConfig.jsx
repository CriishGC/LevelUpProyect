import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Home from "../components/pages/Home";
import PerfilAdmin from "../components/pages/PerfilAdmin";
import PerfilCliente from "../components/pages/PerfilCliente";
import Header from "../components/organisms/Header";   
import Footer from "../components/organisms/Footer";

import Catalogo from "../components/pages/Catalogo";
import Carrito from "../components/pages/Carrito";
import Checkout from "../components/pages/Checkout";
import CompraExitosa from "../components/pages/CompraExitosa";
import ErrorPago from "../components/pages/ErrorPago";
import Blog from "../components/pages/Blog";
import Ofertas from "../components/pages/Ofertas";
import Pedidos from "../components/pages/Pedidos";
import Product from "../components/pages/Product";
import Registro from "../components/pages/Registro";

const RouterConfg = () => (
    <>  
        <Header />
        <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/perfil-admin" component={PerfilAdmin} />
            <Route path="/perfil-cliente" component={PerfilCliente} />
            <Route path="/catalogo" component={Catalogo} />
            <Route path="/carrito" component={Carrito} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/blog" component={Blog} />
            <Route path="/ofertas" component={Ofertas} />
            <Route path="/pedidos" component={Pedidos} />
            <Route path="/product/:id" component={Product} />
            <Route path="/registro" component={Registro} />
            <Route path="/exito" component={CompraExitosa} />
            <Route path="/error" component={ErrorPago} />
        </Switch>
        <Footer />
    </>
);
export default RouterConfg;