# Production Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Backup strategy verified
- [ ] Monitoring set up
- [ ] Incident response plan defined
- [ ] Load testing completed
- [ ] Security audit passed

## Infrastructure Setup

### AWS EKS (Kubernetes)

1. **Create EKS Cluster**
```bash
aws eks create-cluster \
  --name best-equipment-prod \
  --version 1.28 \
  --role-arn arn:aws:iam::ACCOUNT:role/eks-service-role \
  --resources-vpc-config subnetIds=subnet-xxx,subnet-yyy
```

2. **Deploy Applications**
```bash
kubectl apply -f deployment/
```

3. **Setup Ingress**
```bash
kubectl apply -f ingress/nginx-ingress.yaml
```

### Database

1. **RDS PostgreSQL**
   - Instance class: db.r5.2xlarge
   - Storage: 500GB (gp3)
   - Multi-AZ: Enabled
   - Backup retention: 30 days
   - Automated failover: Enabled

2. **Run Migrations**
```bash
npm run migrate -- --direction=up
```

### Redis Cache

- ElastiCache Redis instance
- Node type: cache.r5.large
- Replicas: 2
- Automatic failover: Enabled
- Multi-AZ: Enabled

### CDN & Static Assets

- CloudFront distribution
- S3 bucket for assets
- Cache policy: 1 year for versioned assets

## Deployment Process

### 1. Build Phase
```bash
npm run build
docker build -t best-equipment:latest .
aws ecr get-login-password | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker tag best-equipment:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/best-equipment:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/best-equipment:latest
```

### 2. Deployment
```bash
kubectl set image deployment/api api=ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/best-equipment:latest
kubectl set image deployment/web web=ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/best-equipment-web:latest
```

### 3. Verification
```bash
kubectl rollout status deployment/api
kubectl logs -f deployment/api
```

## Monitoring & Observability

### Prometheus Metrics
- API response times
- Database query performance
- Cache hit rates
- Job completion times
- Error rates

### Grafana Dashboards
- Fleet overview
- Job metrics
- System performance
- Error tracking

### CloudWatch Alarms
- High error rate (>1%)
- High latency (>1000ms)
- Database connection exhaustion
- Memory usage >80%
- Disk usage >80%

### Logging
- ELK Stack for log aggregation
- Log retention: 30 days for production
- Real-time alerts for ERROR logs

## Backup & Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery enabled
- Test restoration monthly

### Application State
- Redis snapshot backups
- Configuration backups
- Version control for all code

### Disaster Recovery
- RTO: 4 hours
- RPO: 1 hour
- Test DR quarterly

## Security

### Network Security
- VPC with private/public subnets
- Security groups restrict traffic
- WAF for DDoS protection
- SSL/TLS for all traffic

### Secrets Management
- AWS Secrets Manager
- Rotate API keys quarterly
- Encrypt environment variables

### Access Control
- IAM roles with least privilege
- MFA for admin access
- API key rotation
- Session timeout: 8 hours

## Performance Optimization

### Database
- Connection pooling (max 100 connections)
- Query result caching
- Index optimization
- Partitioning for large tables

### API
- Response compression (gzip)
- Rate limiting
- Request validation
- Async processing for heavy tasks

### Frontend
- Code splitting
- Image optimization
- Lazy loading
- Service workers

## Rollback Procedure

1. Identify issue
2. Revert to previous version
```bash
kubectl set image deployment/api api=ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/best-equipment:previous
```
3. Verify rollback
4. Post-incident review

## Deployment Schedule

- Development: Continuous deployment
- Staging: Daily builds
- Production: Weekly releases (Friday, 2 PM UTC)
- Emergency hotfixes: ASAP with review

## Support & Escalation

- Level 1: Monitoring & Alerts
- Level 2: On-call engineer (24/7)
- Level 3: Engineering team lead
- Level 4: VP of Engineering
