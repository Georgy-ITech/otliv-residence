import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="notfound">
      <p className="notfound__depth num" aria-hidden="true">404</p>
      <h1 className="h1">Здесь глубже, чем на карте</h1>
      <p>Такой страницы или квартиры нет. Возможно, ссылка устарела.</p>
      <div className="notfound__acts">
        <Link className="btn btn--primary" to="/kvartiry">К квартирам</Link>
        <Link className="btn btn--line" to="/">На главную</Link>
      </div>
    </div>
  );
}
