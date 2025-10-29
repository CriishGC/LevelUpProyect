import { useContext, useEffect } from 'react';
import { UserContext} from '../../context/UserContext';
import { userHistory } from "react-router-dom";

const LoginWrapper = ({ children }) => {
    const { user } = useContext(UserContext);
    const history = userHistory();

    useEffect(() => {
        const  usuario =  JSON.parse(localStorage.getItem("usuario"));
        if (usuario) {
            setUser(usuario);
            history.push(usuario.rol === "admin" ? "/index_admin" : "/perfilUsuario");
        }
    }, [user, history]);

    return  null
};

export default LoginWrapper;
