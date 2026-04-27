## NephroCare Kubernetes runbook (stop / start / reopen)

This file is a copy/paste guide to close and reopen your local setup:
- Backend in Kubernetes (namespace `nephrocare`)
- Frontend locally (Angular)
- Port-forwards for API Gateway + Keycloak

---

### What “running” means

- **Kubernetes workloads**: pods in `nephrocare` are `Running` / `Ready`
- **Port-forward terminals**: you must keep them open while you use the frontend
  - API Gateway: local `30070` → cluster `api-gateway:8070`
  - Keycloak: local `30180` → cluster `keycloak:8180`

---

## Close / stop everything

### A) Stop port-forwards (recommended way)

Just close the terminals where you ran:

```powershell
kubectl -n nephrocare port-forward svc/api-gateway 30070:8070
kubectl -n nephrocare port-forward svc/keycloak 30180:8180
```

If a terminal is stuck, press `Ctrl+C` in that terminal.

### B) If you can’t start port-forward because the port is “already in use”

Find and kill the process holding the port:

```powershell
netstat -ano | findstr ":30070"
taskkill /PID <PID_FROM_NETSTAT> /F
```

And for Keycloak:

```powershell
netstat -ano | findstr ":30180"
taskkill /PID <PID_FROM_NETSTAT> /F
```

---

## Reopen / start everything again

### 1) Ensure the backend pods are running

```powershell
kubectl -n nephrocare get pods -o wide
```

If you see `CrashLoopBackOff`, check logs:

```powershell
kubectl -n nephrocare logs deploy/<service-name> --tail=200
```

### 2) Start port-forwards (keep these terminals open)

Terminal 1 (API Gateway):

```powershell
kubectl -n nephrocare port-forward svc/api-gateway 30070:8070
```

Terminal 2 (Keycloak):

```powershell
kubectl -n nephrocare port-forward svc/keycloak 30180:8180
```

### 3) Quick “is it up?” checks

In a third terminal:

```powershell
iwr -UseBasicParsing http://localhost:30070/actuator/health
```

Optional (Keycloak should respond with HTML/JSON, not connection refused):

```powershell
iwr -UseBasicParsing http://localhost:30180
```

---

## Restart backend (without deleting data)

Restart everything in the namespace:

```powershell
kubectl -n nephrocare rollout restart deploy
kubectl -n nephrocare get pods -w
```

Or restart only gateway + config-server (most common when changing routes/CORS):

```powershell
kubectl -n nephrocare rollout restart deploy/config-server deploy/api-gateway
kubectl -n nephrocare rollout status deploy/config-server --timeout=180s
kubectl -n nephrocare rollout status deploy/api-gateway --timeout=180s
```

After restarting the gateway, you usually must **restart the API Gateway port-forward** too.

---

## Full reset (DANGER: deletes MySQL data)

Only do this when you want to re-run MySQL init scripts and recreate databases/tables from scratch.

```powershell
kubectl -n nephrocare delete deploy/mysql
kubectl -n nephrocare delete pvc/mysql-pvc
kubectl apply -f .\k8s\nephrocare-backend.yaml
kubectl -n nephrocare get pods -w
```

---

## Frontend reopen checklist

- Start the frontend locally as usual (`npm start` / `ng serve`)
- Hard refresh the browser (`Ctrl+F5`)
- If you get `401` after CORS is OK: logout/login again (stale token)

# Open api gateway and keycloack and eureka server 

Start-Process powershell -ArgumentList '-NoExit','-Command','kubectl -n nephrocare port-forward svc/api-gateway 30070:8070'; Start-Process powershell -ArgumentList '-NoExit','-Command','kubectl -n nephrocare port-forward svc/keycloak 30180:8180'; Start-Process powershell -ArgumentList '-NoExit','-Command','kubectl -n nephrocare port-forward svc/discovery-service 8762:8761'